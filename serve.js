const spawn = require('child_process').spawn;
const express = require('express');

const app = express();

const pages = [
  'try',
  'embed',
  'idembed',
  'idve',
  'tsembed',
  'userstudy-archived',
  'userstudy-done',
  'userstudy-experiments',
  'vembed'
];

app.get(`/userstudy`, (req, res) => {
  res.redirect(301, '/userstudy-archived');
});
pages.forEach(page => {
  app.use(`/${page}`, (req, res, next) => {
    req.url = `/.html${req.url.substr(1)}`;
    next('route')
  });
});
app.use(express.static('build'));
app.get('/z3', (req, res) => {
  const p = spawn('z3', ['-version'], {stdio: ['pipe', 'pipe', 'ignore']});
  p.stdin.end();
  p.stdout.pipe(res);
});
app.post('/z3', (req, res) => {
  const p = spawn('z3', ['-T:5', '-smt2', '-in'], {stdio: ['pipe', 'pipe', 'ignore']});
  req.pipe(p.stdin);
  p.stdout.pipe(res);
});
app.use((req, res, next) => {
  res.status(404).sendFile("404.html", {root: __dirname + '/build'});
});
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).sendFile("500.html", {root: __dirname + '/build'});
});
app.listen(3003, '::', () => {
  console.log('esverify-web listening on http://localhost:3003/');
});
