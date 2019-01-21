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

  async _processRemoteResources() {
    this.json.resources.forEach( async (r) => {
      if (r.remote) {
        let split = r.remote.split('/')
        split.shift()
        split.shift()
        split.shift()
        let path = `/${split.join('/')}`
        split.pop()
        let baseUrl  = `/${split.join('/')}`

        split.pop()
        let url = `${baseUrl}/schema.json`
        let remoteSchema = await this._fetch(url) as any

        Object.keys(remoteSchema.json.endpoints).forEach((k) => {
          let config = remoteSchema.json.endpoints[k]
          if (k === path) {
            let remoteResourceJson = remoteSchema.getResource(config.actions.index.resource)
            this._addRemoteResource(remoteSchema, r, remoteResourceJson)
          }
        })
      }
    })
  }

  _addRemoteResource(remoteSchema, localRemoteResource, remoteResource) {
    // We're going to merge this to the local remote
    // but we want to keep the local remote name
    delete remoteResource.name

    // The local remote now has all info
    Object.assign(localRemoteResource, remoteResource)

    // Add further sideloads to the schema
    this._addRemoteRelationships(remoteSchema, remoteResource.relationships)
  }

  _addRemoteRelationships(remoteSchema, relationships) {
    Object.keys(relationships).forEach((k) => {
      let relationship = relationships[k]
      let existing = this.getResource(relationship.resource)
      if (!existing) {
        let resource = remoteSchema.getResource(relationship.resource)
        if (resource) {
          this.json.resources.push(resource)
          this._addRemoteRelationships(remoteSchema, resource.relationships)
        } else {
          console.log('NOT FOUND', relationship.resource)
        }
      }
    })
  }

  async _fetch(url) {
    let headers = new Headers()
    headers.append('pragma', 'no-cache')
    headers.append('cache-control', 'no-cache')
    let init = { method: 'GET', headers }
    let request = new Request(url)
    let schemaJson = await (await fetch(request)).json()
    return new Schema(schemaJson)
  }
}