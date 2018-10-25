export const eachPair = (object: any, callback: Function) => {
  Object.keys(object).forEach((k) => {
    let value = object[k]
    callback(k, value)
  })
}