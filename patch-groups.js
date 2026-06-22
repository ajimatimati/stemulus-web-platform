const fs = require('fs');
const path = require('path');

const seoFile = path.join(__dirname, 'assets', 'js', 'seo-keywords.js');
const indexFile = path.join(__dirname, 'index.html');

// 1. Fix SEO Keywords Array
if (fs.existsSync(seoFile)) {
    let seoContent = fs.readFileSync(seoFile, 'utf-8');
    let origSeo = seoContent;

    seoContent = seoContent.replace(/"small group coding", "individual coding lessons", "cohort-based coding"/g, '"premium 1-on-1 coding", "private coding mentorship", "individual coding lessons"');
    seoContent = seoContent.replace(/"blended learning coding", "flipped classroom STEM", "hybrid learning tech"/g, '"private blended learning coding", "1-on-1 STEM mentorship", "premium tech tutoring"');
    
    if (seoContent !== origSeo) {
        fs.writeFileSync(seoFile, seoContent, 'utf-8');
        console.log('Fixed SEO keywords.');
    }
}

// 2. Fix Index HTML (the one "classroom average" instance is actually fine because it's contrasting against classrooms, but let's check one more issue)
if (fs.existsSync(indexFile)) {
    let indexHtml = fs.readFileSync(indexFile, 'utf-8');
    let origHtml = indexHtml;

    // "Average parent rating across all cohorts" -> "across all private sessions"
    indexHtml = indexHtml.replace(/Average parent rating<br>across all cohorts/g, 'Average parent rating<br>across all private sessions');
    indexHtml = indexHtml.replace(/Ages enrolled<br>every current cohort/g, 'Ages enrolled<br>in active private sessions');

    if (indexHtml !== origHtml) {
        fs.writeFileSync(indexFile, indexHtml, 'utf-8');
        console.log('Fixed index.html cohorts text.');
    }
}
