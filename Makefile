all:
	docker compose -f docker-compose.yaml -f docker-compose.monitoring.yaml up -d --force-recreate
	
backup-pg:
	docker exec -it postgres bash -c "pg_dump -U myuser mydatabase > /var/lib/postgresql/backups/pg.dump"

test-alerts:
	docker stop nginx && sleep 20 && docker start nginx

down:
	docker compose -f docker-compose.yaml -f docker-compose.monitoring.yaml down
	
rm-vol:
	docker volume ls -q | xargs docker volume rm

re: down rm-vol all

provision-dataviews:
	bash provision-dataviews.sh