import parameterize from "@/util/parameterize"

export class Query {
  resource: any
  endpoint: string
  json: any
  ready: boolean
  sorts: any[]
  filters: any[]
  rows: any[]
  headers: any[]
  url: any
  page: any
  relationships: any
  fields: any
  relationshipPath: string

  constructor(resource: any, endpoint?: string, relationshipPath?: string) {
    this.resource = resource
    this.endpoint = endpoint
    this.ready = false
    this.sorts = [{ name: null, dir: 'asc' }]
    this.filters = [{ name: null, operator: 'eq' }]
    this.rows = []
    this.headers = []
    this.url = null
    this.page = {}
    this.relationships = {}
    this.fields = {}
    this.relationshipPath = relationshipPath
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
    path = `${path}.jsonapi`
    if (paramStr != '') {
      path = `${path}?${paramStr}`
    }
    return path
  }

  async fire() {
    this.url = this.generateUrl()
    this.json = await (await fetch(this.url)).json()
    this.ready = true
    let keys = Object.keys(this.json)
    this.rows = this.json.data;
    if (!Array.isArray(this.rows)) {
      this.rows = [this.rows]
    }
    this.rows = this.rows.map((r) => {
      let attrs =  { id: { value: r.id, type: this.resource.attributes.id.type } }

      Object.keys(r.attributes).forEach((a) => {
        let value = r.attributes[a]
        let type = this.resource.attributes[a].type
        let obj = {} as any
        obj[a] = { value, type }
        Object.assign(attrs, obj)
      })

      return attrs
    })

    this.headers = Object.keys(this.rows[0])
  }

  filterParams() {
    let _filters = {} as any
    this.filters.forEach((filter) => {
      if (filter.name) {
        let param = {} as any
        param[filter.operator] = filter.value

        let name = filter.name
        if (this.relationshipPath) {
          name = `${this.relationshipPath}.${name}`
        }

        _filters[name] = param
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

  private paginationParams() {
    let params = {} as any
    Object.keys(this.page).forEach((k) => {
      let name = k

      if (this.relationshipPath) {
        name = `${this.relationshipPath}.${name}`
      }

      params[name] = this.page[k]
    })

    // let nested = this.nestedParams('page')
    let all = Object.assign({}, params)
    // nested.forEach((n) => {
    //   Object.assign(all, n)
    // })

    return all
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