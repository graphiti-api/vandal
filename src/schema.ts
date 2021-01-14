export class Schema {
  json: any
  useCustomHost: boolean
  remoteUrl: string

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
    this.json.resources.forEach(async (r) => {
      if (r.remote) {
        let split = r.remote.split('/')
        split.shift()
        split.shift()
        split.shift()
        let path = `/${split.join('/')}`
        split.pop()
        let baseUrl = `/${split.join('/')}`

        split.pop()

        // Try fetching from the dynamic vandal schema
        // If that fails, fall back to regular schema
        let url
        let remoteSchema
        try {
          if (this.useCustomHost) {
            remoteSchema = await this._fetch(this.remoteUrl) as any
          } else {
            url = `${baseUrl}/vandal/schema.json`
            remoteSchema = await this._fetch(url) as any
          }
        } catch (e) {
          url = `${baseUrl}/schema.json`
          remoteSchema = await this._fetch(url) as any
        }

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
    remoteResource = Object.assign({}, remoteResource)
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
          console.log('Remote Resource Not Found: ', relationship.resource)
        }
      }
    })
  }

  async _fetch(url) {
    let headers = new Headers()
    headers.append('pragma', 'no-cache')
    headers.append('cache-control', 'no-cache')

    if (this.useCustomHost) {
      headers.append("Access-Control-Allow-Origin", "*");
    }

    let init = { method: 'GET', headers }
    let request = new Request(url)
    let schemaJson = await (await fetch(request, init)).json()
    return new Schema(schemaJson)
  }
}