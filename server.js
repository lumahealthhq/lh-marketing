var express = require('express'),
    bodyparser = require('body-parser');
var port = process.env.PORT || 5000;
var sendgrid  = require('sendgrid')(process.env.SENDGRID_API_USER, process.env.SENDGRID_API_KEY);
var slack = require('slack-notify')(process.env.SLACK_ENDPOINT);

var app = express();
app.use(bodyparser.urlencoded());
if(process.env.ENV) {
	app.use(require('express-force-domain')('https://www.lumahealth.io'));

	app.use(function(req, res, next) {
		// NOTE: this is cloudfront SSL Simple specific
	    if (req.headers['cf-visitor'] != '{"scheme":"https"}') {
	        res.redirect('https://' + req.headers.host + req.path);
	    }
	    else {
	        return next();
	    }
	});
}


app.get('/', function(request, response) {
    response.sendfile(__dirname + '/public/index.html');
});

app.post('/signup', function(request, response) {

	response.sendfile(__dirname + '/public/thankyou.html');

	var name = request.body.name,
		email = request.body.email,
		role = request.body.role,
		org = request.body.org;

	var mailbody = 'New web form submission. \n';
	mailbody += 'Name: ' + name + '\n';
	mailbody += 'Email: ' + email + '\n';
	mailbody += 'Role: ' + role + '\n';
	mailbody += 'Org: ' + org + '\n';
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
		text: 'yo homies: `' + name + '` ' + email + ' just signed up on the marketing site. more deets in ur email.',
		username: 'badbot'
	});


});

app.configure(function() {
    app.use('/', express.static(__dirname + '/public/'));
});

app.listen(port);
