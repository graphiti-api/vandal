<template>
  <div class="resource-form" :class="{ editingRelationship: editingRelationship }">
    <form v-on:submit.prevent="fetch()" class="config" :class="{ relationshipForm: relationship }">
      <div class="section first form-group" :class="{ 'top-level': !relationship }">
        <label>Filters</label>
        <a @click="addFilter" class="float-right">Add +</a>

        <div v-for="(filter, index) in request.filters" :key="index" class="form-group" :class="{ 'top-level': !relationship }">
          <div class="clearfix form-group" :class="{ 'top-level': !relationship }">
            <select v-model="filter.name" class="filter-name col-8 float-left form-control">
              <option disabled value="null">Choose</option>
              <option v-for="(config, name) in resource.filters" :key="name">
                {{ name }}
              </option>
            </select>
            <select v-model="filter.operator" class="col-3 float-left form-control">
              <option selected>eq</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
            </select>
          </div>

          <div class='clearfix'>
            <input v-model="filter.value" type="text" class="float-left col-10 form-control" placeholder="Enter Filter Value Here" />
            <a v-if="index != 0" @click="removeFilter(filter)" class='remove col-1'>x</a>
          </div>
        </div>
      </div>

      <div class="section form-group" :class="{ 'top-level': !relationship }">
        <label>Sorts</label>
        <a @click="addSort" class="float-right">Add +</a>

        <div v-for="(sort, index) in request.sorts" :key="index" class='form-group clearfix'>
          <select v-model="sort.name" class="filter-name col-7 float-left form-control">
            <option disabled value="null">Choose</option>
            <option v-for="(config, name) in resource.filters" :key="name">
              {{ name }}
            </option>
          </select>
          <select v-model="sort.dir" class="col-3 float-left form-control">
            <option selected>asc</option>
            <option>desc</option>
          </select>
          <a v-if="index != 0" @click="removeSort(sort)" class='remove col-1'>x</a>
        </div>
      </div>

      <div class="section form-group" :class="{ 'top-level': !relationship }">
        <label>Pagination</label>

        <div class="clearfix">
          <input v-model="request.page.number" type="text" class="col-5 float-left form-control" placeholder="Number" />
          <input v-model="request.page.size" type="text" class="col-5 offset-md-2 float-left form-control" placeholder="Size" />
        </div>
      </div>

      <div class="relationships section form-group" :class="{ 'top-level': !relationship }">
        <label>Relationships</label>

        <div v-for="(config, name) in resource.relationships" :key="name" class="relationship clearfix" :class="{ selected: request.relationships[name] }">
          <div class="float-left name">{{name}}</div>
          <!-- <span v-if="request.relationships[name] && request.relationships[name].deep" class="badge badge-pill badge-success">Deep</span> -->
          <div v-if="request.relationships[name]" class="badge badge-pill badge-info">&#x2713;</div>

          <div v-if="request.relationships[name]" class="controls">
            <a @click="editRelationship(name)">Edit</a>
            <!-- <a @click="deselectRelationship(name)">Remove</a> -->
          </div>
          <div v-else class="controls">
            <a @click.prevent="selectRelationship(name, config)">Select</a>
          </div>

        </div>
      </div>
      <div v-if="!relationship">
        <resource-form :request="request" :resource="resource" :relationship="true" />
      </div>

      <div class="fields section form-group" :class="{ 'top-level': !relationship }">
        <label>Fields</label>

        <div v-for="(config, name) in resource.attributes" :key="name" class="field clearfix" :class="{ selected: request.fields[name] }">
          <span class="name">{{name}}</span>

          <span v-if="request.fields[name]" class="badge badge-pill badge-info">&#x2713;</span>

          <div v-if="request.fields[name]" class="controls">
            <a @click="deselectField(name)">Remove</a>
          </div>
          <div v-else class="controls">
            <a @click.prevent="selectField(name, config)">Select</a>
          </div>
        </div>
      </div>

      <button type="submit" class="btn btn-primary">Submit</button>
    </form>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'resource-form',
  props: ['request', 'resource', 'relationship'],
  data() {
    return {
      editingRelationship: false
    }
  },
  created() {
  },
  methods: {
    addFilter() {
      this.request.filters.push({ name: null, operator: 'eq' })
    },
    removeFilter(filter: any) {
      let index = this.request.filters.indexOf(filter)
      this.request.filters.splice(index, 1)
    },
    addSort() {
      this.request.sorts.push({ name: null, dir: 'asc' })
    },
    removeSort(sort: any) {
      let index = this.request.sorts.indexOf(sort)
      this.request.sorts.splice(index, 1)
    },
    selectRelationship(name: string, config: any) {
      this.$set(this.request.relationships, name, {})
    },
    deselectRelationship(name: string) {
      this.$delete(this.request.relationships, name)
    },
    editRelationship(name: string) {
      this.editingRelationship = this.request.relationships[name]
    },
    selectField(name: string) {
      this.$set(this.request.fields, name, true)
    },
    deselectField(name: string) {
      this.$delete(this.request.fields, name)
    }
  }
})
</script>