/**
 * STEMulus Blog Helper Tool
 * Simplifies adding new posts to the autonomous JSON pool.
 * Usage: node tools/blog-helper.js "Post Title" "Post Category" "Post Description" "Image URL"
 */

const fs = require('fs');
const path = require('path');

const BLOGS_PATH = path.join(__dirname, '../assets/data/blogs.json');

const args = process.argv.slice(2);
if (args.length < 4) {
    console.log('Usage: node tools/blog-helper.js <Title> <Category> <Description> <ImageURL> [ReleaseDays]');
    process.exit(1);
}

const [title, category, description, image, releaseDaysArg] = args;
const releaseDays = releaseDaysArg ? parseInt(releaseDaysArg) : 0;

try {
    const data = fs.readFileSync(BLOGS_PATH, 'utf8');
    const blogs = JSON.parse(data);

    const newPost = {
        id: title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, ''),
        title,
        category,
        date: new Date().toISOString().split('T')[0],
        description,
        image,
        link: `blog-template.html?id=${title.toLowerCase().replace(/ /g, '-')}`,
        featured: false,
        release_days: releaseDays
    };

    blogs.push(newPost);

    fs.writeFileSync(BLOGS_PATH, JSON.stringify(blogs, null, 4));
    console.log(`✅ Success! Added "${title}" to the content pool.`);
    console.log(`🚀 It will release in ${releaseDays} days.`);

} catch (error) {
    console.error('❌ Error adding blog post:', error.message);
}
