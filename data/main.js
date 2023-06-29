// TODO:  clean up unneeded
//        focus on the text box on click

var before = document.getElementById("before");
var liner = document.getElementById("liner");
var command = document.getElementById("typer");
var textarea = document.getElementById("texter");
var terminal = document.getElementById("terminal");
var LINE_SPEED = 80;
var LINE_LENGTH = 100;
var commands = [];

setTimeout(function () {
  loopLines(banner, "", LINE_SPEED);
  textarea.focus();
}, 0);

window.addEventListener("click", function (event) {
  var selection = window.getSelection().toString();
  if (!selection) {
    textarea.focus();
  }
});

window.addEventListener("keyup", enterKey);

textarea.value = "";
command.innerHTML = textarea.value;

function enterKey(e) {
  if (e.keyCode == 13) {
    commands.push(command.innerHTML);
    addLine("visitor@petripihla.com:~$ " + command.innerHTML, "no-animation", 0);
    commander(command.innerHTML);
    command.innerHTML = "";
    textarea.value = "";
  }
}

function insertNewlines(str) {
  var width = LINE_LENGTH; // Choose the number that fits your design
  var space = ' ';
  if (str.length > width) {
    var p = width;
    for (; p > 0 && str[p] != ' '; p--) {
    }
    if (p > 0) {
      var left = str.substring(0, p);
      var right = str.substring(p + 1);
      return left + '<br />' + insertNewlines(right);
    }
  }
  return str;
}

function wrapText(text, width) {
  var words = text.split(' ');
  var lines = [];
  var line = '';

  for (var i = 0; i < words.length; i++) {
    if (line.length + words[i].length > width) {
      lines.push(line);
      line = '';
    }
    line += words[i] + ' ';
  }
  lines.push(line);  // Push the last line to the lines array

  return lines.join('<br />');
}

function commander(cmd) {
  switch (cmd.toLowerCase()) {
    case "help":
      loopLines(help, "color2 margin", LINE_SPEED);
      break;
    case "whois":
      loopLines(whois, "color2 margin", LINE_SPEED);
      break;
    case "email":
      loopLines(email, "", LINE_SPEED);
      break;
    case "linkedin":
      addLine("Opening LinkedIn...", "color2", 0);
      openNewTab(linkedin);
      break;
    case "github":
      addLine("Opening GitHub...", "color2", 0);
      openNewTab(github);
      break;
    case "clear":
      setTimeout(function () {
        terminal.innerHTML = '<a id="before"></a>';
        before = document.getElementById("before");
      }, 0);
      loopLines(banner, "", LINE_SPEED);
      break;
    default:
      addLine("<span class=\"inherit\">Command not found.</span>", "error", 0);
      break;
  }
}

function openNewTab(link) {
  setTimeout(function () {
    window.open(link, "_blank");
  }, 2000);
}

function addLine(text, style, time) {
  var t = "";
  text = wrapText(text, 80); // call the function to insert newlines

  for (let i = 0; i < text.length; i++) {
    if (text.charAt(i) == " " && text.charAt(i + 1) == " ") {
      t += "&nbsp;&nbsp;";
      i++;
    } else {
      t += text.charAt(i);
    }
  }

  setTimeout(function () {
    var next = document.createElement("p");
    next.innerHTML = t;
    next.className = style + " word-wrap";

    before.parentNode.insertBefore(next, before);

    window.scrollTo(0, document.body.scrollHeight);
  }, time);
}

function loopLines(name, style, time) {
  name.forEach(function (item, index) {
    addLine(item, style, index * time);
  });
}
