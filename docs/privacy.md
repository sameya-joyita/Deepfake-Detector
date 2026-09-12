# Privacy and deployment note

The supplied Flask application is a research prototype. During a request it
saves the uploaded video inside a temporary analysis directory. Python's
temporary-directory context removes that directory when the request completes,
including when normal request processing exits through an exception.

This code-level behaviour is not a complete production privacy guarantee.
Reverse proxies, hosting providers, crash reports, access logs, browser caches,
monitoring tools and backups may retain additional information. A deployment
handling real user media requires:

- a documented lawful basis and privacy notice;
- data minimisation and a defined retention period;
- access control, encryption and secure deletion;
- restrictions on logging uploaded content and evidence records;
- procedures for data-subject requests and security incidents; and
- a human-review and appeal process for consequential decisions.

The detector does not perform identity recognition. Nevertheless, uploaded
videos and face crops may contain personal data and should be treated
accordingly.

