export default (client, err) => {
  let errorCode: number[] = [1001, 1006];
  if (errorCode.includes(err.code)) return;
  else return console.error(err);
};