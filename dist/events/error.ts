export default (client, err) => {
  if ([1001, 1006].some(x => x == err.code)) return;
  else return console.error(err);
};