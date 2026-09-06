# Security

The default application has no accounts, stored credentials or database. Its server routes contact fixed upstream hosts and apply basic input validation and request timeouts.

For a security concern, contact the maintainer privately through their GitHub profile rather than posting credentials or exploit details in a public issue. No guaranteed response time or long-term supported release policy is offered for this portfolio project.

Production operators should add rate limiting, HTTPS, dependency monitoring and suitable log retention. Query URLs can include a postcode or coordinates, so avoid unnecessary request-log retention. The app does not implement analytics, but infrastructure and third-party providers may log requests.

Keep dependency licence notices and upstream attribution when modifying the project.
