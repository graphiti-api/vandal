<template>
  <div class="graphici" :class="{ creating, modalIsOpen }">
    <div class="overlay" />

    <div v-if="schema" class="top-level-contents" :class="{ resetting }">
      <div class="row">
        <div class="col-3 left-rail">
          <div class="card">
            <endpoint-list :endpoints="schema.endpoints" @toggle="toggleEndpoint">
              <div class="submission clearfix">
                <a class="reset" @click="reset(query.endpoint)">Reset</a>
                <button
                  @click="fetch()"
                  type="submit"
                  class="col-6 float-right btn btn-primary"
                >
                  Submit &raquo;
                </button>
              </div>

              <resource-form
                :query="query"
                @submit="fetch"
                :schema="schema"
                :depth="0"
                :isShowAction="isShowAction"
              />
            </endpoint-list>
          </div>
        </div>

        <div class="col-9 main">
          <url-bar :schema="schema" :query="query" :firing="firing" />

          <div :class="'request card '+ currentTab.name+'' " >
            <transition name="request-card">
              <div key="1" class="is-ready" v-if="query && query.ready && !query.error">
                <div class="card-header">
                  <ul class="nav nav-tabs card-header-tabs">
                    <li class="nav-item">
                      <a
                        @click="tab(0)"
                        class="nav-link"
                        :class="{ active: currentTab.name == 'results' }"
                      >
                        Results
                      </a>
                    </li>
                    <li class="nav-item">
                      <a
                        @click="tab(1)"
                        class="nav-link"
                        :class="{ active: currentTab.name == 'raw' }"
                      >
                        Raw
                      </a>
                    </li>
                  </ul>
                </div>

                <div class="card-body">
                  <div v-if="currentTab.name == 'raw'">
                    <pre v-highlightjs v-if="query.data.json">
                      <code class="json">{{ query.data.json }}</code>
                    </pre>
                  </div>

                  <div
                    class="loading-area"
                    v-if="currentTab.name == 'results'"
                    :class="{ 'loading-area-active': isLoading }"
                  >
                    <data-table :depth="0" :object="query.data" :isShowAction="isShowAction" />
                  </div>
                </div>
              </div>
              <div class="is-not-ready" v-else>
                Use the left side to configure and fire a request.
              </div>
            </transition>

            <div v-if="query && query.error">
              <div class="alert alert-danger" role="alert">
                {{ query.error }}

                <div v-if="!query.hasRawError">
                  <br />
                  <span class="text-muted">Server configured to hide additional debug information.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      Loading...
    </div>

    <transition name="modal">
      <div v-if="modalIsOpen" class="modal" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <button
                @click="onModalToggle()"
                type="button"
                class="close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <pre v-highlightjs>
                <code class="json">{{ modalContent }}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Schema } from '@/schema'
import { Query } from '@/query'
import ResourceForm from '@/components/ResourceForm.vue'
import DataTable from '@/components/DataTable.vue'
import EndpointList from '@/components/EndpointList.vue'
import UrlBar from '@/components/UrlBar.vue'
import EventBus from '@/event-bus.ts'

const tabs = [
  { name: 'results' },
  { name: 'raw' },
  { name: 'debug' }
]

export default Vue.extend({
  name: 'graphici',
  components: {
    EndpointList,
    DataTable,
    ResourceForm,
    UrlBar
  },
  data() {
    return {
      schema: null as any,
      query: null as null | Query,
      currentTab: tabs[0],
      creating: true,
      isLoading: false,
      path: null as any,
      resource: null as any,
      modalIsOpen: false,
      modalContent: null as string | null,
      firing: false as boolean,
      resetting: false as boolean
    }
  },
  created() {
    this.fetchSchema()
    let doneCreating = () => { this.creating = false }
    setTimeout(doneCreating, 1000)
    EventBus.$on('modalToggle', this.onModalToggle)
  },
  computed: {
    isShowAction() : any {
      if (this.query) return this.query.endpoint.includes('#show')
    }
  },
  methods: {
    onModalToggle(content: string) {
      this.modalContent = content
      this.modalIsOpen = !this.modalIsOpen
    },
    toggleEndpoint(endpoint: string) {
      if (endpoint) {
        this.resource = this.schema.resourceFor(endpoint)
        this.reset(endpoint, false)
      } else {
        this.resource = null
        this.query = null
      }
    },
    async fetchSchema() {
      let headers = new Headers()
      headers.append('pragma', 'no-cache')
      headers.append('cache-control', 'no-cache')
      let init = { method: 'GET', headers }
      let request = new Request('/schema.json')
      let schemaJson = await (await fetch(request)).json()
      this.schema = new Schema(schemaJson)
    },
    reset(endpoint: string, animate: boolean = true) {
      if (animate) this.resetting = true
      this.query = new Query(this.schema, this.resource, endpoint)
      let doReset = () => { this.resetting = false }
      if (animate) setTimeout(doReset, 100)
    },
    async fetch() {
      if (this.validate()) {
        this.firing = true
        let unfire = () => {
          this.firing = false
        }
        setTimeout(unfire, 100)
        this.isLoading = true
        let then = Date.now()
        await this.query.fire()
        let now = Date.now()
        // Force min of 100ms
        await this.stall(100-(now - then))
        this.isLoading = false
      }
    },
    validate() {
      // Object.keys(this.query.resource.filters).forEach((k) => {
      //   let filter = this.query.resource.filters[k]
      //   if (filter.required && !this.query.hasFilterValue(k)) {
      //     filter.error = true
      //   }
      // })

      if (this.isShowAction) {
        let filter = this.query.filters.filter((f) => { return f.name === 'id' })[0]
        if (!filter.value) {
          this.tempSet(filter, 'error', true, 1000)
          return false
        } else {
          filter.error = false
          return true
        }
      } else {
        return true
      }
    },
    tab(index: number) {
      this.currentTab = tabs[index]
    },
    stall(stallTime = 3000) {
      return new Promise(resolve => setTimeout(resolve, stallTime));
    }
  }
});
</script>

<style lang="scss">
$success: lighten(green, 60%);
$danger: lighten(red, 20%);
$warning: lighten(yellow, 20%);
$darkCard: #5c666f;

@keyframes slide-up {
  0% {
    opacity: 1;
    max-height: 300px;
    transform: translateY(0px);
  }
  100% {
    max-height: 0;
    padding: 0 !important;
    margin: 0 !important;
    opacity: 0;
    overflow: hidden;
    border: none;
    line-height: 0;
    transform: translateY(-40px);
  }
}

@keyframes slide-down {
  0% {
    opacity: 0;
    max-height: 0;
  }

  99% {
    opacity: 1;
    max-height: 500px;
  }

  100% {
    opacity: 1;
    max-height: 1000px;
  }
}

@keyframes slide-down-form-group {
  0% {
    opacity: 0;
    max-height: 0;
    transform: translateY(-40px);
  }

  99% {
    opacity: 1;
    max-height: 300px;
    transform: translateY(0);
  }

  100% {
    opacity: 1;
    max-height: none;
  }
}

@keyframes slide-card-right {
  0% {
    left: -200px;
  }

  100% {
    left: 25px;
  }
}

@keyframes slide-endpoints-down {
  0% {
    opacity: 0;
    max-height: 1px;
  }

  99% {
    max-height: 2000px;
  }

  100% {
    opacity: 1;
    max-height: none;
  }
}

@keyframes move-down-query {
  0% {
    transform: translateY(-200px);

    .url-controls {
      right: 0;
    }
  }

  100% {
    transform: translateY(0px);

    .url-controls {
      right: 2rem;
    }
  }
}

@keyframes move-up-request {
  0% {
    transform: translateY(500px);
  }

  100% {
    transform: translateY(0px);
  }
}

@keyframes error {
  from,
  to {
    transform: translate3d(0, 0, 0);
  }

  10%,
  50%,
  90% {
    transform: translate3d(-10px, 0, 0);
  }

  30%,
  70% {
    transform: translate3d(10px, 0, 0);
  }
}

.graphici {
  margin-top: 3rem;
}

.nav-link {
  cursor: pointer;
}

.filter-value {
  transition: all 300ms;
}

.error {
  animation: error 300ms !important;

  .filter-value {
    border: 1px solid red;
    background: $danger;
    color: white;

    &::placeholder {
      color: white;
    }
  }
}

.top-level-contents {
  transition: all 150ms;

  &.resetting {
    transform: translateY(-20px);
    filter: blur(5px);
  }
}

.request.card {
  position: relative;

  .is-ready {
    transition: all 200ms;
    max-height: 1400px;

    &.request-card-leave-active {
      max-height: 0;
      opacity: 0;
    }
  }

  .alert-danger {
    position: absolute !important;
    top: 20px;
    animation: error 300ms !important;
  }
}

.hide, .form-group.hide {
  animation: slide-up 0.4s ease forwards;
  max-height: 0;
  padding: 0 !important;
  margin: 0 !important;
  opacity: 0;
  overflow: hidden;
  border: none;
}

.submission {
  animation: slide-down 0.4s ease forwards;
  border-bottom: 1px solid black;
  padding-bottom: 1rem;
  position: relative;
  height: 60px;

  a.reset {
    transition: all 200ms;
    position: absolute;
    left: 1.5rem;
    top: 0.6rem;
    font-size: 1.3rem;

    &:hover {
      font-size: 1.4rem;
      font-weight: bold;
    }

    &:active {
      font-size: 1.5rem;
      color: red;
      top: 0.3rem;
    }
  }

  button {
    transition: all 200ms;
    font-weight: bold;
    position: absolute;
    top: 0.5rem;
    right: 1rem;

    &:hover {
      background: lighten(orange, 10%);
      font-size: 110%;
    }

    &:focus, &:active {
      box-shadow: none;
      border: none;
    }

    &:active {
      transform: scale(1.1);
      top: 0;
      background: white !important;
      color: black !important;
    }
  }
}

.creating {
  .left-rail .card {
    animation: slide-card-right 0.3s ease forwards;

    .endpoints {
      overflow: hidden;
      max-height: 0px;
      opacity: 0;
      animation: slide-endpoints-down 0.5s ease forwards;
      animation-delay: 0.1s;
    }
  }

  .main .query {
    animation: move-down-query 0.5s ease forwards;
  }

  .main .request {
    animation: move-up-request 0.5s ease forwards;
  }
}

.left-rail {
  .card {
    position: absolute;
    left: 25px;
    width: calc(100% - 25px);
  }
}

.main {
  padding-left: 1rem;
  padding-right: 2rem;

  .request {
    margin-top: 1rem;

    &.raw {
      .card-body {
        padding: 0;

        code {
          padding-left: 2rem;
        }
      }
    }

    .is-not-ready {
      padding: 5rem;
    }

    .raw-response {
      text-align: left;
    }
  }
}

pre {
  text-align: left;
  background-color: transparent;
  border: none;
  border-radius: 0;

  code.hljs {
    background-color: transparent;
    color: lighten(#DAE4F2, 5%);
    line-height: 20px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    &.coffeescript, &.cs, &.javascript, &.json {
      [class*=built_in] {
        color: lighten(#9AB4DB, 5%);
      }
      [class*=string] {
        color: lightgreen;
      }
      [class*=attribute] {
        color: white;
      }
      [class*=literal] {
        color: lighten(red, 30%);
      }
      [class*=c1] {
        color: #B4B4B4;
      }
      [class*=constant] {
        color: #FFDF9D;
      }
      [class*=nx], [class*=number] {
        color: darken(#9ECBEE, 5%);
      }
    }
  }
}

.overlay {
  transition: all 200ms;
  background-color: transparent;
  opacity: 1;
}

.top-level-contents {
  transition: all 200ms;
}

.modal-dialog {
  max-width: 60% !important;
}

.modal {
  display: block;
  font-size: 130%;

  pre {
    margin-bottom: 0;
  }

  code.hljs {
    margin-top: -40px;
    line-height: 1.7rem;
  }

  &.modal-leave-active {
    animation: modal-close 200ms;
  }

  .modal-content {
    background-color: darken($darkCard, 20%);
    border: 2px solid black;
    max-height: 1200px;
    overflow-y: scroll;
  }

  .modal-body {
    padding-top: 0;
    margin-bottom: 0;
  }

  .modal-header {
    padding-bottom: 0;
    border-bottom: none;

    .close {
      z-index: 9999;
    }
  }
}

@keyframes modal-open {
  0% {
    transform: translateY(-400px) scale(0.8);
    opacity: 0;
    max-height: 0;
  }
  100% {
    transform: translateY(0px) scale(1);
    opacity: 1;
    max-height: none;
  }
}

@keyframes modal-close {
  0% {
    transform: translateY(0px) scale(1);
    opacity: 1;
    max-height: none;
  }
  100% {
    transform: translateY(-400px) scale(0.8);
    opacity: 0;
    max-height: 0;
  }
}

.modalIsOpen {
  .overlay {
    position:fixed;
    top:0;
    bottom:0;
    left:0;
    right:0;
    background-color: black;
    opacity:0.55;
    z-index:1001
  }

  .top-level-contents {
    filter: blur(1px);
    opacity: 0.8;
    transform: scale(0.95);
  }

  .modal {
    animation: modal-open 200ms;
  }
}
</style>