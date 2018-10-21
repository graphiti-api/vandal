import parameterize from "@/util/parameterize"

class ResponseData {
  resource: any
  rows: any[]
  headers: string[]
  selectedRow: any
  schema: any
  json: any
  css: any

  constructor(schema: any, resource: any, json: any, rows: any) {
    this.schema = schema
    this.resource = resource
    this.selectedRow = null
    this.json = json

    if (!Array.isArray(rows)) {
      rows = [rows]
    }
    this.rows = rows.map((r: any) => {
      return this.buildRow(this.resource, r)
    })

    this.headers = []
    if (this.rows.length > 0) {
      let headers = [] as any
      this.rows.forEach((r) => {
        Object.keys(r.attrs).forEach((h) => {
          if (headers.indexOf(h) === -1) {
            headers.push(h)
          }
        })
      })
      this.headers = headers
    }

    let sorted = this.rows.map((r) => {
      return r.attrs.id.value.toString().length
    })
    let max = sorted.sort()[sorted.length-1]
    this.css = `columns-${this.headers.length} id-length-${max}`
  }

  formattedJSON() {
    let json = {} as any

    let rows = this.rows
    if (this.selectedRow) {
      rows = [this.selectedRow]
    }
    rows = rows.map((r) => {
      let row = {} as any
      Object.keys(r.attrs).forEach((k) => {
        row[k] = r.attrs[k].value
      })

      Object.keys(r.relationships).forEach((k) => {
        row[k] = r.relationships[k].formattedJSON().data
      })
      return row
    })

    json.data = rows
    return json
  }

  resourceAttributes() {
    if (this.resource.polymorphic) {
      let attrs = this.resource.attributes
      this.resource.children.forEach((resourceName: string) => {
        let childResource = this.schema.getResource(resourceName)
        attrs = Object.assign({}, attrs, childResource.attributes)
      })
      return attrs
    } else {
      return this.resource.attributes
    }
  }

  private buildRow(resource: any, data: any) {
    let attrs =  { id: { value: data.id, type: resource.attributes.id.type } }

    Object.keys(data.attributes).forEach((a) => {
      let value = data.attributes[a]
      let type = this.resourceAttributes()[a].type
      let obj = {} as any
      obj[a] = { value, type }
      Object.assign(attrs,obj)
    })

    let relationships = {} as any
    Object.keys(data.relationships).forEach((k) => {
      let rel = data.relationships[k]
      if (rel.hasOwnProperty('data')) {
        let relResource = this.schema.json.resources.filter((r: any) => {
          return r.name === resource.relationships[k].resource
        })[0]
        let relData = rel.data
        let relRows = [] as any
        if (relData) {
          if (!Array.isArray(relData)) {
            relData = [relData]
          }
          relData.forEach((rd: any) => {
            let allNodes = this.json.data
            if (!Array.isArray(allNodes)) { allNodes = [allNodes] }
            allNodes = allNodes.concat(this.json.included)
            let node = allNodes.filter((n: any) => {
              return n.type === rd.type && n.id === rd.id
            })[0]

            relRows.push(node)
          })

          relationships[k] = new ResponseData(this.schema, relResource, this.json, relRows)
        } else {
          relationships[k] = {}
        }
      }
    })

    let hasRelationships = Object.keys(relationships).length > 0
    return { attrs, relationships, hasRelationships }
  }
}

export class Query {
  resource: any
  endpoint: string
  json: any
  ready: boolean
  sorts: any[]
  filters: any[]
  data: any
  headers: any[]
  url: string | null
  urlWithDomain: string | null
  page: any
  relationships: any
  fields: any
  relationshipPath: string
  editingRelationship: boolean
  selectedRow: any
  schema: any
  endpointIdParam: any

  constructor(schema: any, resource: any, endpoint?: string, relationshipPath?: string) {
    this.resource = resource
    this.endpoint = endpoint
    this.ready = false
    this.sorts = [{ name: null, dir: 'asc' }]
    this.filters = [{ name: null, operator: 'eq', error: null }]
    this.data = {}
    this.headers = []
    this.url = null
    this.urlWithDomain = null
    this.page = {}
    this.relationships = {}
    this.fields = {}
    this.relationshipPath = relationshipPath
    this.editingRelationship = false
    this.selectedRow = null
    this.schema = schema
    this.endpointIdParam = null

    if (endpoint && endpoint.includes('#show')) {
      this.filters = [{ name: 'id', operator: 'eq', required: true, error: null }]
    }
  }

  hasFilterValue(name: string) {
    let found = this.filters.filter((f) => {
      return f.name === name
    })[0]
    return !!(found && found.value)
  }

  generateParams() {
    let params = {}
    Object.assign(params, { filter: this.filterParams() })
    Object.assign(params, { sort: this.sortParams().join(',') })
    Object.assign(params, { page: this.paginationParams() })
    Object.assign(params, { include: this.includes().join(',') })
    Object.assign(params, { fields: this.fieldParams() })
    return params
  }

  generateUrl() {
    let params = this.generateParams()
    let [path, action] = this.endpoint.split('#')
    let paramStr = parameterize(params)
    if (this.endpointIdParam) {
      path = `${path}/${this.endpointIdParam}`
    }
    if (paramStr != '') {
      path = `${path}?${paramStr}`
    }
    return path
  }

  generateCurl() {
    let url = this.urlWithDomain
    let [base, params] = this.urlWithDomain.split('?')
    params = encodeURIComponent(params)
    url = `${base}?${params}`
    return `curl -H 'Content-Type: application/json' ${url}`
  }

  async fire() {
    this.url = this.generateUrl()
    this.urlWithDomain = `${this.schema.json.base_url}${this.url}`
    this.json = await (await fetch(this.url)).json()
    this.ready = true
    let keys = Object.keys(this.json)
    this.data = new ResponseData(this.schema, this.resource, this.json, this.json.data);
  }

  filterParams() {
    let _filters = {} as any
    this.filters.forEach((filter) => {
      if (filter.name) {
        if (filter.name === 'id') {
          this.endpointIdParam = filter.value
        } else {
          let param = {} as any
          param[filter.operator] = filter.value

          let name = filter.name
          if (this.relationshipPath) {
            name = `${this.relationshipPath}.${name}`
          }

          _filters[name] = param
        }
      }
    })

    Object.keys(this.relationships).forEach((k) => {
      let nestedRequest = this.relationships[k]
      let nested = nestedRequest.filterParams()
      Object.assign(_filters, nested)
    })

    return _filters
  }

  sortParams() {
    let _sorts = [] as any
    this.sorts.forEach((sort) => {
      if (sort.name) {
        let param = sort.name

        if (this.relationshipPath) {
          param = `${this.relationshipPath}.${param}`
        }

        if (sort.dir == 'desc') {
          param = `-${param}`
        }
        _sorts.push(param)
      }
    })

    Object.keys(this.relationships).forEach((k) => {
      let nestedRequest = this.relationships[k]
      nestedRequest.sortParams().forEach((s: string) => {
        _sorts.push(s)
      })
    })

    return _sorts
  }

  paginationParams() {
    let params = {} as any
    Object.keys(this.page).forEach((k) => {
      let name = k

      if (this.relationshipPath) {
        name = `${this.relationshipPath}.${name}`
      }

      params[name] = this.page[k]
    })

    Object.keys(this.relationships).forEach((k) => {
      let nestedRequest = this.relationships[k]
      Object.assign(params, nestedRequest.paginationParams())
    })

    return params
  }

  includes() : string[] {
    let _includes = [] as any

    Object.keys(this.relationships).forEach((k) => {
      let nestedRequest = this.relationships[k]
      nestedRequest.includes().forEach((i: string) => {
        _includes.push(i)
      })
    })

    if (_includes.length === 0) {
      _includes.push(this.relationshipPath)
    }

    return _includes
  }

  fieldParams() {
    let _fields = {} as any

    let selectedFields = Object.keys(this.fields)
    if (selectedFields.length > 0) {
      _fields[this.resource.type] = selectedFields.join(',')
    }

    Object.keys(this.relationships).forEach((k) => {
      let nestedRequest = this.relationships[k]
      Object.assign(_fields, nestedRequest.fieldParams())
    })

    return _fields
  }
}