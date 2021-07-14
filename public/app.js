
var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
$(document).on("click", ".new", function() {
  window.location.href = "/new";
})

$(".post-button").click(function(){
  var d = new Date();
  var title = $(".title").html();
  var descr = $(".descr").html();
  var content = $(".content").html();
  var time = ", "+months[d.getMonth()]+" " + String(d.getDate()) + ", " + String(d.getFullYear());
  descr = descr+time;
  title = encodeURIComponent(title);
  descr = encodeURIComponent(descr);
  content = encodeURIComponent(content);
  let xhr = new XMLHttpRequest();
  data = "title="+title + "&content="+content+"&descr="+descr;
  xhr.open("POST","/",true);
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhr.send(data);
  window.location.href = "/";
});
$(".edit-post-button").click(function(){
  var d = new Date();
  id = $(".etitle").attr("id");
  var title = $(".etitle").html();
  var descr = $(".edescr").html();
  var content = $(".econtent").html();
  title = encodeURIComponent(title);
  descr = encodeURIComponent(descr);
  content = encodeURIComponent(content);
  xhr = new XMLHttpRequest();
  data = "title="+title + "&content="+content+"&descr="+descr+"&id="+id;
  xhr.open("POST","/update",true);
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhr.send(data);
  window.location.href = "/";
})
var id;
$(".direct").click(function(){
  id = $(this).attr("id");
  let url = "/open-blog";
  window.location.href=`${url}/${id}`;
});

$(".edit-btn").click(function(){
  id = $(".curr-title").attr("id");
  let url = "/open-edit";
  window.location.href=`${url}/${id}`;
});
$(".delete-btn").click(function(){
  id = $(".etitle").attr("id");
  xhr = new XMLHttpRequest();
  data = "id="+id;
  xhr.open("POST","/delete",true);
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhr.send(data);
  window.location.href = "/";
});
$(".search-btn").click(function(){
  console.log("what");
  var val = $(".search-input").val();
  console.log(val);
  let url = "/search-blog";
  window.location.href=`${url}/${val}`;
})
