-- ============================================================================
-- STEMulus Digital Academy - Server-Enforced Financial Procedures (RPCs)
-- Guarantees atomic transactions, double-spend prevention, and audit history.
-- ============================================================================

-- 1. Batch Generate Monthly Payroll Run
CREATE OR REPLACE FUNCTION generate_monthly_payroll_run(
    p_month SMALLINT,
    p_year SMALLINT,
    p_admin_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_run_id UUID;
    v_tutor RECORD;
    v_total_hours NUMERIC(6, 2);
    v_gross_kobo BIGINT;
    v_total_batch_kobo BIGINT := 0;
BEGIN
    -- Verify caller is admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_admin_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can generate payroll runs.';
    END IF;

    -- Create or fetch existing draft payroll run
    SELECT id INTO v_run_id FROM payroll_runs 
    WHERE period_month = p_month AND period_year = p_year;

    IF v_run_id IS NOT NULL THEN
        IF (SELECT status FROM payroll_runs WHERE id = v_run_id) != 'draft' THEN
            RAISE EXCEPTION 'Payroll run for %/% has already been finalized.', p_month, p_year;
        END IF;
        -- Clear draft items to regenerate
        DELETE FROM payroll_items WHERE payroll_run_id = v_run_id;
    ELSE
        INSERT INTO payroll_runs (period_month, period_year, status)
        VALUES (p_month, p_year, 'draft')
        RETURNING id INTO v_run_id;
    END IF;

    -- Iterate active tutors and aggregate approved attendance hours for the period
    FOR v_tutor IN 
        SELECT id, hourly_rate_kobo FROM tutors WHERE status = 'active'
    LOOP
        SELECT COALESCE(SUM(duration_minutes) / 60.0, 0)
        INTO v_total_hours
        FROM attendance_records
        WHERE tutor_id = v_tutor.id
          AND status = 'approved'
          AND EXTRACT(MONTH FROM session_date) = p_month
          AND EXTRACT(YEAR FROM session_date) = p_year;

        IF v_total_hours > 0 THEN
            v_gross_kobo := ROUND(v_total_hours * v_tutor.hourly_rate_kobo);
            v_total_batch_kobo := v_total_batch_kobo + v_gross_kobo;

            INSERT INTO payroll_items (
                payroll_run_id,
                tutor_id,
                approved_hours,
                hourly_rate_kobo,
                gross_pay_kobo,
                deductions_kobo,
                net_pay_kobo,
                status
            ) VALUES (
                v_run_id,
                v_tutor.id,
                v_total_hours,
                v_tutor.hourly_rate_kobo,
                v_gross_kobo,
                0,
                v_gross_kobo,
                'pending'
            );
        END IF;
    END LOOP;

    -- Update run total
    UPDATE payroll_runs 
    SET total_disbursed_kobo = v_total_batch_kobo,
        updated_at = NOW()
    WHERE id = v_run_id;

    -- Log audit event
    INSERT INTO audit_logs (actor_id, action, target_table, target_id, state_after)
    VALUES (
        p_admin_id,
        'GENERATE_PAYROLL_DRAFT',
        'payroll_runs',
        v_run_id::text,
        jsonb_build_object('month', p_month, 'year', p_year, 'total_kobo', v_total_batch_kobo)
    );

    RETURN v_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Atomic Final Approval of Payroll Run
CREATE OR REPLACE FUNCTION approve_payroll_run(
    p_run_id UUID,
    p_admin_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_status payroll_status;
    v_total BIGINT;
BEGIN
    -- Verify caller is admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_admin_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: Only administrators can approve payroll runs.';
    END IF;

    -- Lock the row to prevent concurrent approval race conditions
    SELECT status, total_disbursed_kobo INTO v_status, v_total
    FROM payroll_runs
    WHERE id = p_run_id
    FOR UPDATE;

    IF v_status IS NULL THEN
        RAISE EXCEPTION 'Payroll run % not found.', p_run_id;
    END IF;

    IF v_status != 'draft' THEN
        RAISE EXCEPTION 'Payroll run is already in status: %', v_status;
    END IF;

    -- Mark run as approved
    UPDATE payroll_runs
    SET status = 'approved',
        approved_by = p_admin_id,
        approved_at = NOW()
    WHERE id = p_run_id;

    -- Mark all associated items as approved
    UPDATE payroll_items
    SET status = 'approved'
    WHERE payroll_run_id = p_run_id;

    -- Audit trail
    INSERT INTO audit_logs (actor_id, action, target_table, target_id, state_before, state_after)
    VALUES (
        p_admin_id,
        'APPROVE_PAYROLL_RUN',
        'payroll_runs',
        p_run_id::text,
        jsonb_build_object('status', 'draft'),
        jsonb_build_object('status', 'approved', 'total_kobo', v_total)
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
