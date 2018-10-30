import { eachPair } from "@/util/each-pair"

export class ResponseTable {
  schema: any
  resource: any
  json: any
  rows: any[]
  includeHash: any
  headers: string[]
  selectedRow: any
  css: any

  constructor(schema: any, resource: any, json: any, rowData: any, includeHash: any) {
    this.schema = schema
    this.resource = resource
    this.selectedRow = null
    this.json = json
    this.includeHash = includeHash

    this._buildRows(rowData)
    this._buildRelationships()
    this._buildHeaders()
    this._buildCSS()
  }

  // Used by Modal
  formattedJSON() {
    let json = {} as any
    let rows = this.rows
    if (this.selectedRow) rows = [this.selectedRow]
    rows = rows.map((r) => {
      let row = {} as any
      eachPair(r.attrs, (key, value) => { row[key] = value.value })
      eachPair(r.relationships, (key, value) => {
        row[key] = value.formattedJSON().data
      })
      return row
    })

    json.data = rows
    return json
  }

  private _buildRows(rowData: any[]) {
    if (!Array.isArray(rowData)) rowData = [rowData]
    this.rows = rowData.map((r: any) => {
      return this.buildRow(this.resource, r)
    })
  }

  private _buildHeaders() {
    let headers = [] as any
    if (this.rows.length > 0) {
      this.rows.forEach((r) => {
        Object.keys(r.attrs).forEach((h) => {
          if (headers.indexOf(h) === -1) headers.push(h)
        })
      })
    }
    this.headers = headers
  }

  private _buildCSS() {
    let sorted = this.rows.map((r) => {
      return r.attrs.id.value.toString().length
    })
    let max = sorted.sort()[sorted.length-1]
    this.css = `columns-${this.headers.length} id-length-${max}`
  }

  // row building

  private _resourceAttributes() {
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

  private _resourceRelationships() {
    if (this.resource.polymorphic) {
      let rels = this.resource.relationships || {}
      this.resource.children.forEach((resourceName: string) => {
        let childResource = this.schema.getResource(resourceName)
        rels = Object.assign({}, rels, childResource.relationships)
      })
      return rels
    } else {
      return this.resource.relationships
    }
  }

  private _buildRowAttributes(schemaResource, jsonResource) {
    let attrs =  {
      id: {
        value: jsonResource.id,
        type: this._resourceAttributes().id.type
      }
    } as any

    if (schemaResource.polymorphic) {
      attrs._type = {
        value: jsonResource.type,
        type: 'string'
      }
    }

    eachPair(jsonResource.attributes, (name, value) => {
      let type = this._resourceAttributes()[name].type
      let obj = { [name]: { value, type } } as any
      Object.assign(attrs, obj)
    })

    return attrs
  }

  private _buildRelationshipNode(jsonRel) {
    let allNodes = this.json.data
    if (!Array.isArray(allNodes)) allNodes = [allNodes]
    allNodes = allNodes.concat(this.json.included)
    let node = allNodes.filter((n: any) => {
      return n.type === jsonRel.type && n.id === jsonRel.id
    })[0]
    return node
  }

  private _eachRelationship(schemaResource, jsonResource, callback) {
    let relationships = jsonResource.relationships || {}
    eachPair(relationships, (name, rel) => {
      let nested = this.includeHash[name]
      if (nested) {
        let config = this._resourceRelationships()[name]
        let relSchemaResource = this.schema.json.resources.filter((r: any) => {
          return r.name === config.resource
        })[0]
        if (config.type === 'polymorphic_belongs_to') {
          relSchemaResource = { polymorphic: true, children: config.resources }
        }

        let relData = rel.data
        let relRows = [] as any
        if (relData) {
          if (!Array.isArray(relData)) relData = [relData]
          relData.forEach((rd: any) => {
            relRows.push(this._buildRelationshipNode(rd))
          })
          callback(name, relSchemaResource, relRows, nested)
        } else {
          callback(name, relSchemaResource, [])
        }
      }
    })
  }

  private _buildRelationships() {
    this.rows.forEach((row) => {
      row.relationships = {} as any
      this._eachRelationship(row.schemaResource, row.jsonResource, (name, schemaResource, rows, nestedInclude) => {
        row.relationships[name] = new ResponseTable(this.schema, schemaResource, this.json, rows, nestedInclude)
      })
      row.hasRelationships = Object.keys(row.relationships).length > 0
    })
  }

  private buildRow(schemaResource: any, jsonResource: any) {
    let attrs = this._buildRowAttributes(schemaResource, jsonResource)
    let row = { attrs, schemaResource, jsonResource }
    return row
  }
}