SERVICES := \
	questify-admin-service \
	questify-auth-service \
	questify-progression-service \
	questify-project-service \
	questify-quest-service \
	questify-stats-service

.PHONY: spotless spotless-check compile test

spotless:
	@set -e; \
	for service in $(SERVICES); do \
		echo "==> $$service"; \
		(cd services/$$service && ./mvnw spotless:apply); \
	done

spotless-check:
	@set -e; \
	for service in $(SERVICES); do \
		echo "==> $$service"; \
		(cd services/$$service && ./mvnw spotless:check); \
	done

compile:
	@set -e; \
	for service in $(SERVICES); do \
		echo "==> $$service"; \
		(cd services/$$service && ./mvnw -q -DskipTests compile); \
	done

test:
	@set -e; \
	for service in $(SERVICES); do \
		echo "==> $$service"; \
		(cd services/$$service && ./mvnw test); \
	done
