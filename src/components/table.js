/**
 * STEMulus Reusable Data Table Component
 * Renders client or server-paginated data with search filtering and sorting.
 */

import { escapeHtml } from '../utils/sanitizers.js';

export class DataTable {
  /**
   * @param {object} config
   * @param {HTMLElement|string} config.container
   * @param {Array<object>} config.columns - [{ key, label, render }]
   * @param {Array<object>} config.data
   * @param {number} config.pageSize
   */
  constructor(config) {
    this.container = typeof config.container === 'string' 
      ? document.querySelector(config.container) 
      : config.container;
    this.columns = config.columns || [];
    this.data = config.data || [];
    this.filteredData = [...this.data];
    this.pageSize = config.pageSize || 10;
    this.currentPage = 1;
    this.searchQuery = '';
    this.sortKey = null;
    this.sortAsc = true;
  }

  setData(newData) {
    this.data = newData || [];
    this.applyFilter();
  }

  applyFilter() {
    if (!this.searchQuery) {
      this.filteredData = [...this.data];
    } else {
      const q = this.searchQuery.toLowerCase().trim();
      this.filteredData = this.data.filter(row => {
        return this.columns.some(col => {
          const val = row[col.key];
          return val !== undefined && String(val).toLowerCase().includes(q);
        });
      });
    }

    if (this.sortKey) {
      this.filteredData.sort((a, b) => {
        const valA = a[this.sortKey];
        const valB = b[this.sortKey];
        if (valA === valB) return 0;
        const res = valA > valB ? 1 : -1;
        return this.sortAsc ? res : -res;
      });
    }

    this.currentPage = 1;
    this.render();
  }

  render() {
    if (!this.container) return;

    const totalPages = Math.ceil(this.filteredData.length / this.pageSize) || 1;
    const start = (this.currentPage - 1) * this.pageSize;
    const pageRows = this.filteredData.slice(start, start + this.pageSize);

    let html = `
      <div class="stem-datatable-wrapper overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200">
    `;

    this.columns.forEach(col => {
      html += `
        <th class="py-3 px-4 font-bold text-slate-700 select-none cursor-pointer" data-col="${escapeHtml(col.key)}">
          ${escapeHtml(col.label)}
        </th>
      `;
    });

    html += `
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
    `;

    if (pageRows.length === 0) {
      html += `
        <tr>
          <td colspan="${this.columns.length}" class="py-8 text-center text-slate-400">
            No records found.
          </td>
        </tr>
      `;
    } else {
      pageRows.forEach(row => {
        html += `<tr class="hover:bg-slate-50/70 transition-colors">`;
        this.columns.forEach(col => {
          const content = typeof col.render === 'function' ? col.render(row) : escapeHtml(row[col.key] || '');
          html += `<td class="py-3 px-4 text-slate-600">${content}</td>`;
        });
        html += `</tr>`;
      });
    }

    html += `
          </tbody>
        </table>
        <div class="py-3 px-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing ${pageRows.length ? start + 1 : 0} to ${Math.min(start + this.pageSize, this.filteredData.length)} of ${this.filteredData.length} records</span>
          <div class="flex gap-1">
            <button class="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors" data-action="prev" ${this.currentPage <= 1 ? 'disabled' : ''}>Prev</button>
            <span class="px-3 py-1 font-semibold text-slate-700">Page ${this.currentPage} of ${totalPages}</span>
            <button class="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors" data-action="next" ${this.currentPage >= totalPages ? 'disabled' : ''}>Next</button>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    // Attach pagination listeners
    const prevBtn = this.container.querySelector('[data-action="prev"]');
    const nextBtn = this.container.querySelector('[data-action="next"]');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.render();
        }
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.render();
        }
      });
    }
  }
}
