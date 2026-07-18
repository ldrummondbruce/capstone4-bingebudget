import express from "express";
import bodyParser from "body-parser";
import _ from "lodash";

const app = express();
const port = 3000;

const homeStartingContent =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque at bibendum dui. Maecenas varius risus iaculis justo dapibus, non tincidunt urna viverra. Proin porta nisi nec venenatis volutpat. Maecenas mollis bibendum orci et lacinia. Nullam blandit porttitor vulputate. Integer pretium molestie interdum. Phasellus imperdiet elit at nibh aliquet, vel egestas risus efficitur. Praesent sit amet nisl egestas, sagittis nibh vel, aliquet sem. Donec gravida lacinia leo. Donec id dui magna. Aliquam eu velit non nisl porta hendrerit at facilisis lorem. Suspendisse potenti. Nunc dignissim cursus dui nec ullamcorper. Aenean turpis mi, lobortis egestas fringilla sed, egestas et nisi.';
const aboutStartingContent = "Nulla iaculis ante vel ante tempus, nec aliquet massa placerat. Quisque dictum pretium augue non elementum. Quisque mattis iaculis commodo. Fusce quis diam lobortis, dictum massa a, consequat turpis. Vivamus ligula ipsum, porttitor vitae nisl ac, pellentesque sodales sapien. Vivamus turpis erat, auctor eget eros vel, porta lacinia ligula. Morbi ligula dui, auctor ac ante eu, fermentum scelerisque ligula.";
const contactStartingContent = "Nullam eu nibh gravida, vulputate elit vel, luctus leo. Cras malesuada augue dolor, eget suscipit erat efficitur ut. Curabitur pulvinar feugiat dictum. Suspendisse egestas placerat ante vitae lacinia. Ut erat velit, porta sed finibus vitae, maximus vel felis. Quisque sem quam, tempus in quam vitae, dignissim viverra tortor. Cras quis bibendum sapien.";

let posts = [];

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index.ejs", {
    intro: homeStartingContent,
    blogPosts: posts
  });
});

app.get("/about", (req, res) => {
  res.render('about.ejs', {
    intro: aboutStartingContent,
    blogPosts: posts
  });
});

app.get("/contact", (req, res) => {
  res.render('contact.ejs', {
    intro: contactStartingContent,
    blogPosts: posts
  });
});

app.get("/compose", (req, res) => {
  res.render('compose.ejs', {
    blogPosts: posts
  });
});

// Change this to only return a single post so I can also pass its current index
// Or change matchPosts to be an array of objects that also includes each post's current index
app.get("/posts/:postTitle", (req, res) => {
  let matchPosts = [];
  const reqTitle = _.lowerCase(req.params.postTitle);
  // console.log(reqTitle);

  posts.forEach((post, i) => {
    const postTitle = _.lowerCase(post.postTitle);
    // console.log(postTitle);
    if (
      postTitle.includes(reqTitle) ||
      reqTitle.includes(postTitle)
    ) {
      matchPosts.push({post: post, postIndex: i});
    }
  });
  res.render('post.ejs', {
    blogPosts: posts,
    matched: matchPosts
  });
});

app.get("/edit/:postIndex", (req, res) => {
  const currentPost = posts[req.params.postIndex];
  res.render('edit.ejs', {
    blogPosts: posts,
    postIndex: req.params.postIndex,
    post: currentPost,
  });
});

app.get('/delete/:postIndex', (req, res) => {
  posts.splice(req.params.postIndex, 1);
  res.redirect("/");
});

app.post("/compose", (req, res) => {
  // console.log(`postTitle: ${req.body.postTitle}`);
  // console.log(`postContent: ${req.body.postContent}`);
  const blogPost = {
    postTitle: `${req.body.postTitle}`,
    postContent: `${req.body.postContent}`,
    // readMore: `<a href="/posts/${_.lowerCase(req.body.postTitle)}" title="${req.body.postTitle}">Read More</a>`,
  };
  posts.push(blogPost);
  // console.log(posts);

  res.redirect("/");
});

app.post("/edit/:postIndex", (req, res) => {
  // console.log("req.body.postTitle: " + req.body.postTitle);
  const updPost = {
    postTitle: `${req.body.postTitle}`,
    postContent: `${req.body.postContent}`,
  };
  // console.log(updPost);
  // console.log('updPost.postTitle: ' + updPost.postTitle);
  // console.log('req.params.postIndex: ' + req.params.postIndex);
  posts[req.params.postIndex] = updPost;
  // console.log(posts);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});