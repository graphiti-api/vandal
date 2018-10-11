export class Schema {
  json: any

  constructor(json: any) {
    this.json = json
  }

  getResource(name: string) {
    let resource = this.json.resources.find((r: any) => {
      return r.name == name
    })
    return resource
  }

  resourceFor(endpoint: any) {
    let [path, action] = endpoint.split('#')
    let resourceName = this.json.endpoints[path]['actions'][action].resource
    return this.getResource(resourceName)
  }

  get endpoints() {
    let endpoints = [] as any
    Object.keys(this.json.endpoints).forEach((path) => {
      Object.keys(this.json.endpoints[path].actions).forEach((action) => {
        endpoints.push(`${path}#${action}`)
      })
    })
    return endpoints
  }
}