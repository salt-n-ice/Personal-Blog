const express = require("express");
const bodyParser = require("body-parser");
const multiparty = require("multiparty");
const app = express();
const http = require("http").Server(app);
const jsdom = require('jsdom')
const fs = require("fs");
const mongoose = require("mongoose");
const crypto = require("crypto-js");
const mongoUrl = require("./config/mongodb");
/*<--------Parameters-------->*/
var bpp = 4, pop = 3, cnt = 0, limit = 0; // [blogs per page, popular blogs count, total blogs, maximum number of pages]
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
mongoose.set("useFindAndModify", false);

const blogSchema = new mongoose.Schema({
  title: String,
  descr: String,
  content: String,
  id: String,
  time: Number,
  views: Number
});
const Blog = mongoose.model("Blog", blogSchema);
//updating collection count
setTimeout(function () {
  Blog.countDocuments({}, function (err, c) {
    if (err) console.log(err);
    else {
      cnt = c; limit = Math.ceil((cnt * 1.0) / bpp);
    }
  });
}, 1000);
app.get("/", function (req, res) {
  showFront(res, 1);
});

app.get("/blog-nav/:page", function (req, res) {
  var page = req.params.page;
  showFront(res, page);

});

app.get("/new", function (req, res) {
  res.sendFile(__dirname + "/public/new.html");
});
app.get("/open-blog/:id", function (req, res) {
  let currId = req.params.id;
  openBlog(res, currId);
});
app.get("/open-edit/:id", function (req, res) {
  let currId = req.params.id;
  openEdit(res, currId);
});

app.get("/search-blog/:val", function (req, res) {
  // console.log(req.params.val);
  var regex = new RegExp(req.params.val, 'i');
  searchDatabase(res, regex);
})

app.post("/", function (req, res) {
  let form = new multiparty.Form();
  form.parse(req, function (err, fields, files) {
    newTitle = (req.body.title);
    newContent = encrypt(req.body.content);
    newDescr = (req.body.descr);
    newId = makeid();
    newView = 1;
    var d = new Date();
    newTime = d.getTime();

    //insert in the database
    Blog.insertMany([{ title: newTitle, descr: newDescr, content: newContent, id: newId, time: newTime, views: newView }]).then(function () {
      //update tot blogs
      Blog.countDocuments({}).exec(function (err, c) {
        if (err) console.log(err);
        else {
          cnt = c; limit = Math.ceil((cnt * 1.0) / bpp);
        }
      });
    }).catch(function (err) {
      console.log(err);
    });
    res.end();
  });
  res.sendStatus(200);
});
app.post("/update", function (req, res) {
  let form = new multiparty.Form();
  form.parse(req, function (err, fields, files) {
    newTitle = (req.body.title);
    newContent = encrypt(req.body.content);
    newDescr = (req.body.descr);
    currId = req.body.id;
    var d = new Date();
    newTime = d.getTime();
    //update data entry with id = currId
    Blog.findOneAndUpdate({ id: currId }, { title: newTitle, content: newContent, descr: newDescr, time: newTime }, null, function (err, docs) {
      if (err) console.log(err);
      res.sendStatus(200);
    });
    // res.end();
  });
})
app.post("/delete", function (req, res) {
  let form = new multiparty.Form();
  form.parse(req, function (err, fields, files) {
    currId = req.body.id;
    //update tot blogs
    Blog.deleteOne({ id: currId }).then(function () {
      Blog.countDocuments({}).exec(function (err, c) {
        if (err) console.log(err);
        else {
          cnt = c; limit = Math.ceil((cnt * 1.0) / bpp);
          res.sendStatus(200);
        }
      });
    }).catch(function (err) {
      console.log(err);

    });
    // res.end();
  });
});




/* <---------------Functions----------------> */

function makeid() {
  let length = 10;
  var result = [];
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result.push(characters.charAt(Math.floor(Math.random() *
      charactersLength)));
  }
  return result.join('');
}
function encrypt(data) {
  var ciphertext = crypto.AES.encrypt(data, 'secretkey123').toString();
  return ciphertext;
}
function decrypt(ciphertext) {
  var bytes = crypto.AES.decrypt(ciphertext, 'secretkey123');
  var originalText = bytes.toString(crypto.enc.Utf8);
  return originalText;
}



function showFront(res, page) {
  fs.readFile("index.html", "utf8", function (err, data) {
    if (!err) {
      var file = data;
      const dom = new jsdom.JSDOM(file);
      const jquery = require('jquery')(dom.window);
      Blog.find({}).sort({ time: -1 }).setOptions({ skip: bpp * page - bpp, limit: bpp }).exec(function (err, docs) {
        if (err) {
          console.log(err);
        }
        else {
          for (let i = 0; i < docs.length; ++i) {
            docs[i].content = decrypt(docs[i].content);
            docs[i].descr = (docs[i].descr);
            docs[i].title = (docs[i].title);
            if (docs[i].content.length > 500) {
              jquery(".blogs").append(`<div class='card' id="` + docs[i].id + `">
               <h2 class="direct" id="` + docs[i].id + `">` + docs[i].title + `</h2>
              <h5>` + docs[i].descr + `</h5>
              <p>`+ docs[i].content.slice(0, 500) + `<a id="` + docs[i].id + `" class='link-primary direct'>...Read more</a></p></div>`);
            }
            else {
              jquery(".blogs").append(`<div class='card' id="` + docs[i].id + `">
              <h2 class="direct" id="` + docs[i].id + `">` + docs[i].title + `</h2>
              <h5>` + docs[i].descr + `</h5>
              <p>`+ docs[i].content + `</p></div>`);
            }
          }
          Blog.find({}).sort({ views: -1 }).setOptions({ skip: 0, limit: pop }).exec(function (err, docs) {
            if (err) {
              console.log(err);
            }
            else {
              for (let i = 0; i < Math.min(docs.length, 5); ++i) {
                docs[i].title = (docs[i].title);
                jquery(".pops").append(`<div class="pop-blog direct" id="` + docs[i].id + `">` + docs[i].title + `</div>`)
              }

            }
            page = parseInt(page);
            let page_no = [page];
            let curr_page = page;
            let m = 1;
            while (curr_page - m >= 1) {
              curr_page -= m;
              page_no.unshift(curr_page);
              m *= 2;
            }
            if (curr_page != 1) page_no.unshift(1);
            curr_page = page;
            m = 1;
            while (curr_page + m <= limit) {
              curr_page += m;
              page_no.push(curr_page);
              m *= 2;
            }
            if (curr_page != limit) page_no.push(limit);
            // console.log(page_no);
            for (let i = 0; i < page_no.length; ++i) {
              if (page_no[i] != page) jquery(".pages").append(`<li class="page-item"><a class="page-link" href="/blog-nav/` + page_no[i] + `">` + page_no[i] + `</a></li>`)
              else jquery(".pages").append(`<li class="page-item active"><a class="page-link" href="/blog-nav/` + page_no[i] + `">` + page_no[i] + `</a></li>`)
            }
            const content = dom.window.document.querySelector("html");
            res.send(content.innerHTML);
          });

        }
      });

    }
    else {
      console.log("File not found?!");
    }
  });
}
function openBlog(res, currId) {
  fs.readFile("public/blog.html", "utf8", function (err, data) {
    if (!err) {
      var file = data;
      const dom = new jsdom.JSDOM(file);
      const jquery = require('jquery')(dom.window);
      var currTitle, currDescr, currContent;
      // get the data associated with rhe currId
      Blog.findOne({ id: currId }, function (err, docs) {
        if (err) console.log(err);
        else {
          currTitle = (docs.title);
          currDescr = (docs.descr);
          currContent = decrypt(docs.content);
          currViews = (1 + docs.views);
          Blog.findOneAndUpdate({ id: currId }, { views: currViews }, null, function (err, docs) {
            if (err) console.log(err);
          });
          if (currTitle) {
            jquery(".curr-title").html(currTitle);
            jquery(".curr-descr").html(currDescr);
            jquery(".curr-content").html(currContent);
            jquery(".curr-title").attr("id", currId);
          }
          else {
            jquery(".curr-title").html("Nothing found Sorry!");
          }
          Blog.find({}).sort({ views: -1 }).setOptions({ skip: 0, limit: pop }).exec(function (err, docs) {
            if (err) {
              console.log(err);
            }
            else {
              for (let i = 0; i < Math.min(docs.length, 5); ++i) {
                docs[i].title = (docs[i].title);
                jquery(".pops").append(`<div class="pop-blog direct" id="` + docs[i].id + `">` + docs[i].title + `</div>`)
              }

            }
            const content = dom.window.document.querySelector("html");
            res.send(content.innerHTML);
          });
        }
      });

    }
    else {
      console.log("File not found?!");
    }
  });
}
function openEdit(res, currId) {
  fs.readFile("public/edit.html", "utf8", function (err, data) {
    if (!err) {
      var file = data;
      const dom = new jsdom.JSDOM(file);
      const jquery = require('jquery')(dom.window);
      var currTitle, currDescr, currContent;
      // get the data associated with rhe currId
      Blog.findOne({ id: currId }, function (err, docs) {
        if (err) console.log(err);
        else {
          currTitle = (docs.title);
          currDescr = (docs.descr);
          currContent = decrypt(docs.content);
          if (currTitle) {
            jquery(".etitle").html(currTitle);
            jquery(".edescr").html(currDescr);
            jquery(".econtent").html(currContent);
            jquery(".etitle").attr("id", currId);
          }
          else {
            jquery(".etitle").html("Nothing found Sorry!");
          }
          const content = dom.window.document.querySelector("html");
          res.send(content.innerHTML);
        }
      });

    }
    else {
      console.log("File not found?!");
    }
  });
}
function searchDatabase(res, regex) {
  fs.readFile("index.html", "utf8", function (err, data) {
    if (!err) {
      var file = data;
      const dom = new jsdom.JSDOM(file);
      const jquery = require('jquery')(dom.window);
      Blog.find({ $or: [{ title: regex }, { descr: regex }] }).sort({ time: -1 }).setOptions({ skip: 0, limit: 10 }).exec(function (err, docs) {
        if (err) {
          console.log(err);
        }
        else {
          if (docs.length > 0) {
            for (let i = 0; i < docs.length; ++i) {
              docs[i].content = decrypt(docs[i].content);
              docs[i].descr = (docs[i].descr);
              docs[i].title = (docs[i].title);
              if (docs[i].content.length > 500) {
                jquery(".blogs").append(`<div class='card' id="` + docs[i].id + `">
                 <h2 class="direct" id="` + docs[i].id + `">` + docs[i].title + `</h2>
                <h5>` + docs[i].descr + `</h5>
                <p>`+ docs[i].content.slice(0, 500) + `<a id="` + docs[i].id + `" class='link-primary direct'>...Read more</a></p></div>`);
              }
              else {
                jquery(".blogs").append(`<div class='card' id="` + docs[i].id + `">
                <h2 class="direct" id="` + docs[i].id + `">` + docs[i].title + `</h2>
                <h5>` + docs[i].descr + `</h5>
                <p>`+ docs[i].content + `</p></div>`);
              }
            }
          }
          else {
            jquery(".blogs").append(`<h2>Nothing found sorry!</h2>`)
          }
          Blog.find({}).sort({ views: -1 }).setOptions({ skip: 0, limit: pop }).exec(function (err, docs) {
            if (err) {
              console.log(err);
            }
            else {
              for (let i = 0; i < Math.min(docs.length, 5); ++i) {
                docs[i].title = (docs[i].title);
                jquery(".pops").append(`<div class="pop-blog direct" id="` + docs[i].id + `">` + docs[i].title + `</div>`)
              }

            }
            const content = dom.window.document.querySelector("html");
            res.send(content.innerHTML);

          });

        }
      });

    }
    else {
      console.log("File not found?!");
    }
  });
}






http.listen(process.env.PORT || 3030, function () {
  console.log("Server started...");
})
