// TODO:  clean up unneeded
//        focus on the text box on click

var before = document.getElementById("before");
var liner = document.getElementById("liner");
var command = document.getElementById("typer");
var textarea = document.getElementById("texter");
var terminal = document.getElementById("terminal");
var LINE_SPEED = 80;
var commands = [];

setTimeout(function () {
  loopLines(banner, "", LINE_SPEED);
  textarea.focus();
}, 0);

window.addEventListener("click", function (event) {
  textarea.focus();
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
    next.className = style;

    before.parentNode.insertBefore(next, before);

    window.scrollTo(0, document.body.offsetHeight);
  }, time);
}

function loopLines(name, style, time) {
  name.forEach(function (item, index) {
    addLine(item, style, index * time);
  });
}
