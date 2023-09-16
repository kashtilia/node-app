<script>
  import { link } from "svelte-spa-router";

  import { formatDate, formatSearchResult } from "./lib";

  export let entry;
  export let isActive;
</script>

<style>
  .date {
    font-style: italic;
  }
  .title {
    margin-top: 0;
  }
</style>

<a
  class="uk-card uk-card-small uk-card-default uk-card-body uk-margin-top {isActive ? 'uk-card-primary' : 'uk-card-hover'}"
  use:link={`/note/${entry.id}`}
  href="/">
  <h6 class="date">{formatDate(entry.date)}</h6>
  <h4 class="title">
    {@html formatSearchResult(entry) || '<em>без заголовка</em>'}
  </h4>
</a>
