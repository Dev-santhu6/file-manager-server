const jwt = require ( "jsonwebtoken")

function generateToken(res, username) {
  const token = jwt.sign({ id: username }, process.env.JWT_SECRET, { expiresIn: '1d' });

  console.log('Generated Token:', token); // Debugging line

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'None',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });
}


module.exports =  generateToken;
