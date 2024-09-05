const jwt = require ( "jsonwebtoken")

function generateToken(res, username) {
  const token = jwt.sign({ id: username }, process.env.JWT_SECRET, { expiresIn: '1h' });

  console.log('Generated Token:', token); // Debugging line

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600000,
  });
}


module.exports =  generateToken;
