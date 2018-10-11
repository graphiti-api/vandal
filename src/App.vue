<template>
  <div id="app" class="d-flex flex-column h-100">
    <router-view/>
  </div>
</template>

<style lang="scss">
$nav-tabs-link-active-color: white;
$nav-tabs-link-active-bg: darken(grey, 40%);
$success: lighten(green, 60%);
$danger: lighten(red, 20%);
$warning: lighten(yellow, 20%);

.sizeable-link {
  display: inline-block;
  transition: all 200ms;

  &:hover {
    text-decoration: none;
    transform: scale(1.15);
  }
}

.loading-area {
  transition: all 200ms;

  &.loading-area-active {
    transform: scale(0.97);
    filter: blur(2px);
    opacity: 0.5;
  }
}

.alert-success, .alert-danger {
  position: fixed !important;
  top: 100px;
  left: 10%;
  width: 82%;
  z-index: 9999;
  box-shadow: -2px 2px 6px 2px rgba(0,0,0,0.4);
  border: 2px solid black;
}

.navbar {
  padding: 0.5rem 2rem !important;

  .right-nav a {
    margin-left: 1rem;
    color: white;
  }

  .logout {
    margin-top: 5px;
  }
}

.nav-tabs {
  border-bottom: 1px solid !important;

  .nav-item {
    border-bottom: 1px solid;

    .nav-link {
      color: #f0f0f0;
      font-weight: 600;
      letter-spacing: 1px;
      font-size: 110%;

      &:hover {
        border: none;
      }

      &.active {
        color: white;

        &:hover {
          border: 1px solid;
        }
      }
    }
  }
}

.nav-pills {
  .nav-link.active {
    border: 1px solid orange;
    background: transparent !important;
  }
}

@import '~bootstrap/scss/bootstrap.scss';
@import '~highlight.js/styles/default.css';

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #f0f0f0;
}

body {
  // height:100vh;
  background: url('/assets/img/squares.png');

  .left-rail {
    flex-grow: 1;
  }
}

.card {
  background: url("https://www.toptal.com/designers/subtlepatterns/patterns/classy_fabric.png");
  border-radius: 5px;
  border: 1px solid black;
  box-shadow: -2px 2px 6px 2px rgba(0,0,0,0.4);
  padding: 20px;
}

.btn.btn-primary {
  border: none;
  background-color: orange;
}

.btn-lg {
  font-size: 200%;
  letter-spacing: 1px;
}

.table {
  $table: darken(grey, 30%);
  $border-radius: 5px;

  text-align: center;
  border: 1px solid black;
  width: 100%;
  background-color: $table;
  border-radius: $border-radius;
  box-shadow: inset 0px -1px 6px -1px black;
  position: relative;
  margin-bottom: 1rem;

  thead, .thead {
    @extend .clearfix;
    border-top: 1px solid black;
    border-bottom: 1px solid black;
    border-radius: $border-radius $border-radius 0 0;
    box-shadow: inset 0px 3px 4px -1px black;
    transform: scale(1, 1.1);
    line-height: 1rem;
    letter-spacing: 2px;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.8);
    text-shadow: 1px 1px 2px darken($table, 20%);

    tr {
      border-top: 1px solid rgba(255,255,255,0.1);
      border-bottom: 1px solid rgba(0,0,0,0.3);
    }
  }

  th, .th, thead th, .thead .th {
    padding-to: 1rem;
    padding-bottom: 1rem;
    border-bottom: none;
    border-top: none;

    a {
      color: lighten(#90CAF9, 10%) !important;
    }
  }

  tbody, .tbody {
    tr, .tr {
      &:nth-child(odd) {
        border-top: 1px solid rgba(255,255,255,0.1);
        border-bottom: 1px solid rgba(0,0,0,0.3);
      }

      &:hover {
        background-color: darken($table, 5%);
      }

      td {
        border-top: none;
      }
    }
  }
}

a, a:not([href]):not([tabindex]) {
  color: #90CAF9;
  cursor: pointer;

  &:hover {
    color: lighten(#90CAF9, 10%);
  }

  &.destroy {
    color: red;

    &:hover {
      color: lighten(red, 20%)
    }
  }
}

.navbar {
  margin-bottom: 10px;
  box-shadow: 0px -8px 13px 7px rgba(0, 0, 0, 1);
}


</style>