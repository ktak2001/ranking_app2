
export const yearMonth = () => {
  const today = new Date()
  const year = today.getFullYear().toString()
  var month = today.getMonth() + 1
  month = month < 10 ? "0"+month.toString():month.toString()
  return {year, month}
}

export const showMoney = (value) => {
  return Math.floor(value).toLocaleString() + " Pts"
}