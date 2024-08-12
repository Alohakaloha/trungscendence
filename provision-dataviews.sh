#!/usr/bin/env bash

set -a && source .env && set +a # https://gist.github.com/mihow/9c7f559807069a03e302605691f85572

docker exec -it es01 curl  --fail -s --cacert /usr/share/elasticsearch/config/certs/ca/ca.crt \
-H 'Content-Type: application/json' \
-H "Authorization: Basic $(echo -n ${ELASTIC_USER}:${ELASTIC_PASSWORD} | base64 )" \
-H "kbn-xsrf: reporting" \
-X POST "http://kibana:5601/api/data_views/data_view" \
-d'
{
  "data_view": {
     "title": "nginx4-*",
     "name": "My nginx4 Data View"
  }
}
' -v || exit 1

docker exec -it es01 curl  --fail -s --cacert /usr/share/elasticsearch/config/certs/ca/ca.crt \
-H 'Content-Type: application/json' \
-H "Authorization: Basic $(echo -n ${ELASTIC_USER}:${ELASTIC_PASSWORD} | base64 )" \
-H "kbn-xsrf: reporting" \
-X POST "http://kibana:5601/api/data_views/data_view" \
-d'
{
  "data_view": {
     "title": "django4-*",
     "name": "My django4 Data View"
  }
}
' -v || exit 1
