# General Page Rendering Rule

*When a user says a page should "lead to the general page", the page at that URL must render the general content for that resource. It should **not** redirect to an alternative URL (e.g., `/champions/[name]` → `/champions`). The intent is to preserve the current path while showing non‑paginated, all‑tags content.

If the page should serve a subset of data (e.g., filtered by a query parameter), that filtering can be applied after the component loads, but the route itself should not perform a redirect.