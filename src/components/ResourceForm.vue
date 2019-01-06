<template>
  <div class="resource-form">
    <form v-on:submit.prevent="$emit('submit')" class="config">
      <button style="display: none" v-if="!isRelationship" type="hidden" class="btn btn-primary">Submit</button>

      <div class="query-inputs" :class="{ hide: query.editingRelationship }">
        <div class="section filters first form-group">
          <label>Filters</label>
          <a @click="addFilter" class="add">Add +</a>

          <transition-group name="form-input-section">
            <div v-for="(filter, index) in query.filters" :key="index" class="form-group filter" :class="{ error: filter.error }">
              <div class="clearfix form-group">
                <select v-model="filter.name" class="filter-name col-8 float-left form-control">
                  <option disabled value="null">Choose</option>
                  <option v-for="(config, name) in query.resource.filters" :key="name">
                    {{ name }}
                  </option>
                </select>
                <select v-if="filter.name" v-model="filter.operator" class="col-3 float-left form-control">
                  <option v-for="operator in query.resource.filters[filter.name].operators" :key="operator">
                    {{ operator }}
                  </option>
                </select>
                <select v-else class="col-3 float-left form-control">
                  <option selected disabled>eq</option>
                </select>
              </div>

              <div class='clearfix'>
                <div v-if="filter.name && query.resource.filters[filter.name].type === 'boolean'" class="boolean-toggle">
                  <input v-model="filter.value" type="checkbox" :name="filter.name" :id="filter.name" class="ios-toggle" />
                  <label :for="filter.name" class="checkbox-label" data-off="off" data-on="on"></label>
                </div>
                <div v-else-if="filter.name && query.resource.filters[filter.name].allow">
                  <select v-model="filter.value" class="filter-value form-control col-10 float-left">
                    <option disabled value="undefined">Choose</option>
                    <option v-for="value in query.resource.filters[filter.name].allow" :key="value">
                      {{ value }}
                    </option>
                  </select>
                </div>
                <div v-else-if="filter.name && query.resource.filters[filter.name].type === 'date'">
                  <input
                    v-model="filter.value"
                    type="text"
                    class="filter-value float-left col-10 form-control"
                    placeholder="M/D/YYYY"
                  />
                </div>
                <div v-else-if="filter.name && query.resource.filters[filter.name].type === 'datetime'">
                  <input
                    v-model="filter.value"
                    type="text"
                    class="filter-value float-left col-10 form-control"
                    placeholder="M/D/YYYY h:mma"
                  />
                </div>
                <div v-else>
                  <input v-model="filter.value" type="text" class="filter-value float-left col-10 form-control" placeholder="Enter Filter Value Here" />
                </div>
                <a @click="removeFilter(filter)" class='remove col-1'>x</a>
              </div>

              <div class="required-filter text-muted" v-if="filter.required">
                Required
              </div>
            </div>
          </transition-group>
        </div>

        <div class="section sorts form-group">
          <label>Sorts</label>
          <a @click="addSort" class="add">Add +</a>

          <transition-group name="form-input-section">
            <div v-for="(sort, index) in query.sorts" :key="index" class='form-group clearfix'>
              <select v-model="sort.name" class="filter-name col-7 float-left form-control">
                <option disabled value="null">Choose</option>
                <option v-for="(config, name) in query.resource.sorts" :key="name">
                  {{ name }}
                </option>
              </select>
              <select v-model="sort.dir" class="col-3 float-left form-control">
                <option selected>asc</option>
                <option>desc</option>
              </select>
              <a @click="removeSort(sort)" class='remove col-1'>x</a>
            </div>
          </transition-group>
        </div>

        <div class="section form-pagination form-group">
          <label>Pagination</label>

          <div v-if="isShowAction || !isRelationship" class="form-group clearfix">
            <input v-model="query.page.number" type="number" class="col-5 float-left form-control" placeholder="Number" />
            <input v-model="query.page.size" type="number" class="col-5 float-left size form-control" placeholder="Size" />
            <a @click="removePagination()" class='remove col-1'>x</a>
          </div>
          <div v-else class="form-group clearfix text-muted">
            Only #show supports nested pagination
          </div>
        </div>
      </div>

      <div class="relationships section form-group" :class="{ 'editing-subrelationship': query.editingRelationship, nested: (query.editingRelationship && isRelationship), 'active-subrelationship': isActiveSubrelationship, 'inactive-subrelationship': !isActiveSubrelationship, ['depth-'+depth]: true }">
        <label v-if="!(query.editingRelationship && isRelationship)">Relationships</label>

        <div v-for="(config, name) in query.possibleRelationships" :key="name" class="relationship clearfix" :class="{ ['depth-'+depth]: true, selected: query.relationships[name], hide: (query.editingRelationship && query.editingRelationship != query.relationships[name]) }">
          <a class='toggle clearfix' @click="toggleRelationship(name, config)">
            <div class="float-left name">{{name}}</div>

            <span v-if="isActiveSubrelationship">
              <div v-if="query.relationships[name]" class="badge badge-pill badge-info">&#x2713;</div>
            </span>
          </a>

          <a v-if="query.relationships[name]" @click="removeRelationship(name)" class="remove-field">Remove</a>
        </div>
      </div>

      <div v-for="(config, name) in query.relationships" :key="name">
        <div v-if="query.relationships[name]" :class="{ hidden: query.editingRelationship != query.relationships[name] }">
          <resource-form
            :query="query.relationships[name]"
            :schema="schema"
            :is-relationship="true"
            @editRelationship="onSubrelationshipEdit"
            @doneEditRelationship="onSubrelationshipDoneEdit"
            :isShowAction="isShowAction"
            :depth="depth+1"
          />
        </div>
      </div>

      <div class="fields section form-group" :class="{ hide: query.editingRelationship }">
        <label>Fields</label>

        <div v-if="config.readable && name != 'id'" v-for="(config, name) in query.resource.attributes" :key="name" class="field clearfix" :class="{ selected: query.fields[name] }">
          <a @click="toggleField(name, config)" class="toggle clearfix">
            <span class="name">{{name}}</span>
            <span v-if="query.fields[name]" class="badge badge-pill badge-info">&#x2713;</span>
          </a>
        </div>
      </div>

    </form>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Query } from '@/query'

export default Vue.extend({
  name: 'resource-form',
  props: ['query', 'isShowAction', 'isRelationship', 'schema', 'depth'],
  data() {
    return {
      subRelationshipNames: [] as string[],
      isActiveSubrelationship: false as boolean
    }
  },
  created() {
  },
  computed: {
  },
  methods: {
    addFilter() {
      this.query.filters.push({ name: null, operator: 'eq', error: null })
    },
    removeFilter(filter: any) {
      if (filter.required) {
        filter.value = null
      } else {
        let index = this.query.filters.indexOf(filter)
        this.query.filters.splice(index, 1)
        if (this.query.filters.length < 1) {
          this.addFilter()
        }
      }
    },
    addSort() {
      this.query.sorts.push({ name: null, dir: 'asc', delete: false })
    },
    removeSort(sort: any) {
      let index = this.query.sorts.indexOf(sort)
      this.query.sorts.splice(index, 1)
      if (this.query.sorts.length === 0) {
        this.addSort()
      }
    },
    removePagination() {
      this.query.page = { number: null, size: null}
    },
    selectRelationship(name: string, config: any) {
      let subResource = this.schema.getResource(config.resource)
      // NB: doesn't support fields yet b/c ?fields[type] - dont know type
      if (config.type === 'polymorphic_belongs_to') {
        let relationships = {}
        config.resources.forEach((r: any) => {
          let resource = this.schema.getResource(r)
          Object.assign(relationships, resource.relationships)
        })
        subResource = {
          polymorphic: true,
          children: config.resources,
          relationships
        }
      }
      let relationshipPath = name
      if (this.query.relationshipPath) {
        relationshipPath = `${this.query.relationshipPath}.${name}`
      }
      let subQuery = new Query(this.schema, subResource, null, relationshipPath)
      this.$set(this.query.relationships, name, subQuery)
    },
    removeRelationship(name: string) {
      this.$delete(this.query.relationships, name)
      this.doneEditingRelationship(name)
    },
    toggleRelationship(name: string, config: any) {
      if (this.query.editingRelationship) {
        this.doneEditingRelationship(name)
      } else if (this.query.relationships[name]) {
        this.editRelationship(name, this.query.relationships[name])
      } else {
        this.selectRelationship(name, config)
      }
    },
    editRelationship(name: string, subQuery: any) {
      this.$emit('editRelationship', name)
      this.query.editingRelationship = subQuery
      this.isActiveSubrelationship = true
    },
    doneEditingRelationship(name: string) {
      this.query.editingRelationship = false
      this.isActiveSubrelationship = false
      this.$emit('doneEditRelationship', name)
    },
    toggleField(name: string) {
      if (this.query.fields[name]) {
        this.$delete(this.query.fields, name)
      } else {
        this.$set(this.query.fields, name, true)
      }
    },
    onSubrelationshipEdit(name: string) {
      this.isActiveSubrelationship = false
    },
    onSubrelationshipDoneEdit(name: string) {
      this.isActiveSubrelationship = true
    }
  }
})
</script>

<style lang="scss" scoped>
$success: lighten(green, 60%);
$danger: lighten(red, 20%);
$warning: lighten(yellow, 20%);

.form-group {
  position: relative;
  display: block;
  .form-input-section-enter-active {
    animation: slide-down-form-group 0.2s ease forwards;
  }

  .form-input-section-leave-active {
    animation: slide-up 0.1s ease forwards;
  }
}

.text-muted {
  color: lighten(#6c757d, 20%) !important;
}

.query-inputs {
  &:not(.hide) {
    animation: slide-down 0.4s ease forwards;
  }
}

.section {
  &.filters {
    .remove {
      top: 3.5rem;
    }
  }

  &.form-pagination {
    input.size {
      margin-left: 0.5rem;
    }

    .remove {
      top: 0.3rem;
      right: 0.7rem;
    }
  }
}

.required-filter {
  margin-top: 0.5rem;
}

.hidden {
  display: none;
}

.form-row {
  margin-bottom: 1rem;
}

.add {
  position: absolute;
  right: 20px;
}

.relationships {
  .nested {
    text-align: left;
  }

  > label {
    display: block;
    transition: all 200ms;
  }

  .relationship {
    position: relative;

    .toggle {
      display: block;
    }

    .remove-field {
      display: none;
    }

    .name {
      transition: all 200ms;
    }

    &:not(.selected) {
      &:hover {
        .name {
          color: $warning;
          font-size: 110%;
        }
      }
    }

    &.selected {
      .name {
        color: $success;
        font-size: 110%;
        font-weight: bold;
      }

      &:hover {
        .remove-field {
          display: block !important;
        }
      }
    }

    .remove-field {
      position: absolute;
      right: 0;
      top: 0.5rem;
      color: $danger !important;
    }
  }

  &.editing-subrelationship {
    margin-top: 0;
    padding-top: 1rem;
    margin-bottom: 0;

    &:not(.depth-0) {
      padding-top: 0;
      border: none;

      > label {
        max-height: 0;
        opacity: 0;
        margin: 0;
        padding: 0;
      }

      .toggle {
        padding: 0;
      }
    }

    &.inactive-subrelationship, &.active-subrelationship {
      .relationship .toggle {
        padding: 0
      }

      a.remove-field {
        top: 0.1rem;
      }
    }

    &.inactive-subrelationship {
      .toggle .name {
        font-weight: normal;
        color: #f0f0f0;
      }
    }

    &.active-subrelationship {
      margin-bottom: 1rem;

      .relationship .name {
        font-size: 110%;
        font-weight: bold;
      }
    }

    .relationship {
      padding-bottom: 0;
      border-bottom: none;
    }

    @for $i from 0 through 10 {
      .relationship.selected.depth-#{$i} {
        padding-left: $i*14px;
        padding-top: 0;

        @if $i != 0 {
          // margin-top: -3px;
        }
      }
    }
  }
}

.fields {
  .field {
    a .name {
      transition: all 200ms;
    }

    &.selected {
      a .name {
        color: $success;
        font-weight: bold;
        font-size: 110%;
      }
    }

    &:not(.selected) {
      &:hover {
        a .name {
          font-size: 110%;
          color: $warning;
        }
      }
    }
  }
}

.section {
  margin-top: 2rem;
  border-top: 1px solid darken(grey, 25%);
  padding-top: 1rem;

  &.first {
    margin-top: 0;
  }
}

.config {
  .filter-name {
    margin-right: 5px;
  }

  button {
    float: right;
    margin-bottom: 1rem;
  }
}

.remove {
  position: absolute;
  right: 10px;
  top: 2px;
  // float: right;
  // margin-top: 3px;
  color: $danger !important;
  // margin-right: 3px;
}

.relationships, .fields {
  .relationship, .field {
    border-bottom: 1px dashed darken(grey, 25%);
    text-align: left;
    cursor: pointer;

    &:last-child {
      border-bottom: none;
    }

    a.toggle {
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
      display: block;
    }

    .name {
      color: white;
      padding-right: 10px;
    }

    .badge {
      &:last-child {
        margin-left: 5px;
      }
    }
  }
}

.boolean-toggle {
  width: 60px;
  margin: auto;
  text-align: center;

  .ios-toggle, .ios-toggle:active{
    position:absolute;
    top:-5000px;
    height:0;
    width:0;
    opacity:0;
    border:none;
    outline:none;
  }
  .checkbox-label{
    display:block;
    position:relative;
    padding:10px;
    margin-bottom:20px;
    font-size:12px;
    line-height:16px;
    width:100%;
    height:36px;
    /*border-radius*/
    -webkit-border-radius:18px;
      -moz-border-radius:18px;
            border-radius:18px;
    background:darken(#f8f8f8, 50%);
    cursor:pointer;
  }
  .checkbox-label:before{
    content:'';
    display:block;
    position:absolute;
    z-index:1;
    line-height:34px;
    text-indent:40px;
    height:36px;
    width:36px;
    /*border-radius*/
    -webkit-border-radius:100%;
      -moz-border-radius:100%;
            border-radius:100%;
    top:0px;
    left:0px;
    right:auto;
    background: #dddddd;
    box-shadow: 0 3px 3px rgba(0,0,0,.6),0 0 0 0px darken(#dddddd, 60%);
  }
  .checkbox-label:after{
    content:attr(data-off);
    display:block;
    position:absolute;
    z-index:0;
    top:0;
    left:-300px;
    padding:10px;
    height:100%;
    width:300px;
    text-align:right;
    color:#bfbfbf;
    white-space:nowrap;
  }
  .ios-toggle:checked + .checkbox-label{
    box-shadow:inset 0 0 0 20px darken($success, 5%),0 0 0 2px darken($success, 5%);
  }
  .ios-toggle:checked + .checkbox-label:before{
    left:calc(100% - 36px);
    box-shadow:0 0 0 2px transparent,0 3px 3px rgba(0,0,0,.3);
    background: white;
  }
  .ios-toggle:checked + .checkbox-label:after{
    content:attr(data-on);
    left:60px;
    width:36px;
  }
  #checkbox1 + .checkbox-label{
    box-shadow:inset 0 0 0 0px $success,0 0 0 2px #dddddd;
  }
  #checkbox1:checked + .checkbox-label{
    box-shadow:inset 0 0 0 18px $success,0 0 0 2px $success;
  }
  #checkbox1:checked + .checkbox-label:after{
    color: $success;
  }
  *,*:before,*:after{
    box-sizing:border-box;
    margin:0;
    padding:0;
    /*transition*/
    -webkit-transition:.25s ease-in-out;
      -moz-transition:.25s ease-in-out;
        -o-transition:.25s ease-in-out;
            transition:.25s ease-in-out;
    outline:none;
    font-family:Helvetica Neue,helvetica,arial,verdana,sans-serif;
  }
}
</style>