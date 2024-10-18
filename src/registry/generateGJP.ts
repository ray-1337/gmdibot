const base64Encode = (str: string) => {
  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
};

const generateXorCipher = (str: string) => {
  const key: string = "37526";

  let result = '';

  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  };

  return result;
};

const generateGJP = (pass: string) => {
  let gjp = generateXorCipher(pass);
  gjp = base64Encode(gjp);

  return gjp;
};

export default generateGJP;