import parameterize from "@/util/parameterize"

export class Request {
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

  // todo: make accept a resource, endpoint optional
  // then for relationship, have config have new Request()
  // this makes the form work, then recursively walk request objects
  constructor(endpoint: string) {
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
  }

  generateUrl() {
    let [path, action] = this.endpoint.split('#')
    let params = {}
    Object.assign(params, this.filterParams())
    Object.assign(params, this.sortParams())
    Object.assign(params, { page: this.page })
    Object.assign(params, this.relationshipParams())
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
    this.rows = this.rows.map((r) => { return r.attributes })

    this.headers = Object.keys(this.rows[0])
  }

  private filterParams() {
    let _filters = {} as any
    this.filters.forEach((filter) => {
      if (filter.name) {
        let param = {} as any
        param[filter.operator] = filter.value
        _filters[filter.name] = param
      }
    })
    return { filter: _filters }
  }

  private sortParams() {
    let _sorts = [] as any
    this.sorts.forEach((sort) => {
      if (sort.name) {
        let param = sort.name
        if (sort.dir == 'desc') {
          param = `-${param}`
        }
        _sorts.push(param)
      }
    })
    return { sort: _sorts.join(',') }
  }

  private relationshipParams() {
    let _relationships = [] as any

    Object.keys(this.relationships).forEach((k) => {
      _relationships.push(k)
    })

    return { include: _relationships.join(',') }
  }

  // todo constructor needs resource for type
  private fieldParams() {
    let _fields = [] as any
  }
}