export class Schema {
  json: any

  constructor(json: any) {
    this.json = json
    console.log(this.json)
  }

  resourceFor(endpoint: any) {
    let [path, action] = endpoint.split('#')
    let resourceName = this.json.endpoints[path]['actions'][action].resource
    console.log(resourceName)
    let resource = this.json.resources.find((r: any) => { return r.name == resourceName })
    return resource
      // this.endpoint = schema.endpoints['/api/v1/employees']['actions']['index']
  }
}