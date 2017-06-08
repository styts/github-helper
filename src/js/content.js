require("../css/content.css")

var $ = require('jquery')
var moment = require('moment')
var tmpl = require('blueimp-tmpl')
var store = require('store')

function renderTemplate (data) {
  var context = {
    stars: data.stargazers_count,
    forks: data.forks,
    issues: data.open_issues_count,
    user: data.owner.login,
    repo: data.name,
    url: data.html_url,
    updated_at: moment(data.updated_at).fromNow()
  }
  return tmpl(`<h3>{%=o.user%}/{%=o.repo%}</h3>
<span class="info">Stars: {%=o.stars%}</span>
<span class="info">Forks: {%=o.forks%}</span><br/>
<span class="info">Open issues: {%=o.issues%}</span><br/>
<span class="info">Last update: {%=o.updated_at%}</span>`, context)
}

function logView (repo) {
  let recent = store.get('recent', [])
  recent = recent.filter(
    (x) => !((x.repo === repo.repo) && (x.user === repo.user))) // remove current repo
  recent.unshift({time: Date.now(), ...repo}) // insert at beginning
  store.set('recent', recent)
}

function repoPath (repo) {
  return repo.user + '/' + repo.repo
}

function apiRequest (repo, target) {
  var path = repoPath(repo)
  var url = 'https://api.github.com/repos' + '/' + path
  var cached = store.get(path)
  if (cached) {
    target.html(renderTemplate(cached))
  } else {
    $.ajax({
      url: url,
      success: function (data, status) {
        store.set(path, data)
        target.html(renderTemplate(data))
      },
      error: function (xhr, status, errorThrown) {
        if (xhr.status === 403) {
          var header = xhr.getResponseHeader('X-RateLimit-Reset')
          var till = moment.unix(header).fromNow()
          target.html('Next API call possible<br/>' + till)
        }
      }
    })
  }
}

function showTooltip (ev) {
  var target = ev.target

  var tooltip = $(`<div id='gh-tooltip'><div class="gh-loading" /></div>`)

  tooltip.insertAfter(target)
  tooltip[0].style.marginLeft = ev.offsetX + 'px'

  var repo = parseUrl(target.href)
  apiRequest(repo, tooltip)
  logView(repo)
}

function hideTooltip (ev) {
  $('#gh-tooltip').fadeOut().remove()
}

function parseUrl (url) {
  var re = /https?:\/\/github.com\/(.*?)\/(.*)/
  var match = re.exec(url)

  if (match) {
    var u = match[1]
    var r = match[2]
    if (r.indexOf('/') > 0) {
      r = r.slice(0, r.indexOf('/'))
    }
    if (u !== 'site') {
      return {
        user: match[1],
        repo: r
      }
    }
  }
}

window.onload = function () {
  $("a[href*='/github.com/']").filter(function () {
    return !!parseUrl(this.href)
  }).filter(function () {
            // don't link to own repo when on a github page
    var repo = parseUrl(this.href)
    return window.location.href.indexOf(repoPath(repo)) < 0
  }).addClass('gh-github-link')
        .hover(showTooltip, hideTooltip)
}
