const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Discovery service is running on port ${port}`);
});

app.get('/api/get_path/:port', (req, res) => {
  var port_to_path_dict = {
    8080 : '/',
    10000 : '/mdenet-auth',
    8069 : '/tools/conversion/',
    8070: '/tools/epsilon/services',
    8071: '/tools/emfatic',
    8072: '/tools/ocl/',
    8073: '/tools/emf/',
    8074: '/tools/xtext/',
    9000: '/tools/xtext/services/xtext',
    10001: '/tools/xtext/project/'
  };

  if (!isNaN(parseInt(req.params.port)) &&
  port_to_path_dict.hasOwnProperty(req.params.port)) {
    res.send(port_to_path_dict[req.params.port]);
  }
  else{
    res.status(404);
    res.send('Not Found');
  }
});