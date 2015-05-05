var express = require('express'),
    bodyparser = require('body-parser');
var port = process.env.PORT || 5000;
var sendgrid  = require('sendgrid')(process.env.SENDGRID_API_USER, process.env.SENDGRID_API_KEY);
var slack = require('slack-notify')(process.env.SLACK_ENDPOINT);

var app = express();
app.use(bodyparser.urlencoded());
if(process.env.ENV) {
	app.use(function(req, res, next) {
		if (req.headers['host'] != 'www.lumahealth.io') {
			res.redirect('https://www.lumahealth.io' + req.path);
		} else {
			return next();
		}

	});

	app.use(function(req, res, next) {
		// NOTE: this is cloudfront SSL Simple specific
	    if (req.headers['cf-visitor'] != '{"scheme":"https"}') {
	        res.redirect('https://' + req.headers.host + req.path);
	    } else {
	        return next();
	    }
	});
}

app.get('/login', function(request, response) {
	if(request.headers.host.indexOf('fortid') > 0) {
		response.redirect('http://app.fortid.com/')
	} else if(request.headers.host.indexOf('luma') > 0) {
		response.redirect('https://app-next.lumahealth.io/')
	} else {
		response.redirect('http://localhost:3000/')
	}


});


app.get('/', function(request, response) {
    response.sendfile(__dirname + '/public/index.html');
});

app.get('/thankyou', function(request, response) {
	response.sendfile(__dirname + '/public/thankyou.html');
})

app.post('/', function(request, response) {

	var name = request.body.name,
		email = request.body.email,
		role = request.body.role,
		org = request.body.org,
		utm_source = request.query.utm_source || '',
		utm_medium = request.query.utm_medium || '',
		utm_content = request.query.utm_content || '',
		utm_campaign = request.query.utm_campaign || '';

	var utms = '';
	utms = utm_source + ' ' + utm_medium + ' ' + utm_content + ' ' + utm_campaign;

	var mailbody = 'New web form submission. \n';
	mailbody += 'Name: ' + name + '\n';
	mailbody += 'Email: ' + email + '\n';
	mailbody += 'Role: ' + role + '\n';
	mailbody += 'Org: ' + org + '\n';
	mailbody += 'UTMs: ' + utms + '\n';
	mailbody += (new Date());

	console.log(mailbody);

	sendgrid.send({
	  to:       'info@lumahealth.io',
	  from:     'lh-marketing@lumahealth.io',
	  subject:  'Web Form Submission ' + name,
	  text:     mailbody
	}, function(err, json) {
	  if (err) { return console.error(err); }
	  console.log(json);
	});

	
	slack.send({
		channel: '#general',
		text: 'yo homies: `' + name + '` ' + email + ' just signed up on the marketing site. ' + utms.trim(),
		username: 'badbot'
	});

	response.redirect('/thankyou');
});

app.configure(function() {
    app.use('/', express.static(__dirname + '/public/'));
});

console.log('starting lh-marketing on port ' + port);
app.listen(port);
