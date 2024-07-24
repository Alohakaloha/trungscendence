bakup-pg:
	docker exec -it postgres bash -c "pg_dump -U myuser mydatabase > /var/lib/postgresql/backups/pg.dump"