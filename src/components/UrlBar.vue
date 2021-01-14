<template>
  <div class="url-bar">
    <form class="query clearfix" v-if="query && query.endpoint">
      <input id="copy-url" type="hidden" :value="schema.json.base_url + query.url" />
      <input @input="buildQueryObject" v-model="query.url" type="text" class="form-control url" placeholder="URL" :class="{ firing }" />

      <div class="btn-group url-controls">
        <a @click="copyUrl()" title="Copy" class="btn btn-secondary">
          <i class="fas fa-copy"></i>
        </a>
        <a :href="query.urlWithDomain" target="_blank" class="btn btn-secondary" title="Open in new tab">
          <i class="fas fa-external-link-alt"></i>
        </a>
        <a @click="copyAsCurl()" class="btn btn-secondary" title="Copy as Curl">
          <i class="fas fa-copyright"></i>
        </a>
      </div>
    </form>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { urlToQuery } from "@/util/url-to-query"

export default Vue.extend({
  name: 'url-bar',
  props: ['schema', 'query', 'firing'],
  data() {
    return {
    }
  },
  computed: {
  },
  methods: {
    copyUrl() {
      navigator['clipboard'].writeText(this.query.urlWithDomain)
    },
    copyAsCurl() {
      navigator['clipboard'].writeText(this.query.generateCurl())
    },
    buildQueryObject() {
      let query = urlToQuery(this.query)
    }
  }
});
</script>

<style lang="scss" scoped>
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

.query {
  position: relative;

  .url {
    transition: all 50ms;
    box-shadow: 0px 0px 0px 0px white;
    float: left;
    margin: 0 !important;

    &.firing {
      border: none;
      color: white;
      box-shadow: 0px 0px 20px 5px white;

      & + .url-controls {
        display: none;
      }
    }
  }

  .url-controls {
    position: absolute;
    right: 0;
    border-radius: 0;

    .btn {
      background-color: darken(#6c757d, 20%);
      border-top: 1px solid black;
      border-bottom: 1px solid black;
      border-left: none;
      border-right: none;
      padding-right: 1.5rem;
      padding-left: 1.5rem;
      padding-top: 8px;
      margin-top: -1px;
      text-align: center;
      color: lighten(orange, 20%);
      width: 5rem;
      height: 2.5rem;
      transition: all 200ms;

      i {
        transition: all 200ms;
        position: absolute;
        left: 40%;
        top: 27%;
      }

      &:hover {
        font-size: 110%;
        color: white;
      }

      &:active {
        background-color: black;

        i {
          top: 10%;
          font-size: 140%;
        }
      }

      &:first-child {
        z-index: 2;
        border-right: 1px dashed black !important;
      }

      &:last-child {
        z-index: 2;
        border-left: 1px dashed black !important;
      }
    }
  }
}
</style>
