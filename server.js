var express = require('express'),
    bodyparser = require('body-parser');
var port = process.env.PORT || 5000;
var sendgrid  = require('sendgrid')(process.env.SENDGRID_API_USER, process.env.SENDGRID_API_KEY);
var Slackbot = require('slackbot')
var slackbot = new Slackbot(process.env.SLACKDOMAIN, process.env.SLACK_TOKEN);

var app = express();
app.use(bodyparser.urlencoded());
if(process.env.PRODUCTION) {
	app.use(require('express-force-domain')('http://www.lumahealth.io'));
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

	slackbot.send('#general',
		'sup fools. ' + name + ' signed up, check ur email for the deets',
		function(err, res, body) {
		  if(err) {
		  	console.log(err);
		  };
		  console.log(body);
	});


});

app.configure(function() {
    app.use('/', express.static(__dirname + '/public/'));
});

app.listen(port);
