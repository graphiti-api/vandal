import parameterize from "@/util/parameterize"
import { ResponseTable } from "@/response-table"

export class Query {
  resource: any
  endpoint: string
  schema: any

  sorts: any[]
  filters: any[]
  page: any
  fields: any

  data: any
  headers: any[]
  json: any

  url: string | null
  urlWithDomain: string | null
  relationships: any
  relationshipPath: string

  ready: boolean
  editingRelationship: boolean
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
    if (this.endpointIdParam) path = `${path}/${this.endpointIdParam}`
    if (paramStr != '') path = `${path}?${paramStr}`
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
    this.data = new ResponseTable(this.schema, this.resource, this.json, this.json.data, this.includeHash())
  }

  // param generation

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

  includeHash() {
    let hash = {}
    this.includes().forEach((path) => {
      const [last, ...paths] = path.split('.').reverse()
      Object.assign(hash, paths.reduce((acc, el) => ({ [el]: acc }), { [last]: {} }))
    })
    return hash
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