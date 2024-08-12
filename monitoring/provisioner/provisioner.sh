#!/usr/bin/env bash

BASICAUTH_BASE64=$(echo -n ${ELASTIC_USER}:${ELASTIC_PASSWORD} | base64 )

curl -s --cacert /usr/share/elasticsearch/config/certs/ca/ca.crt \
-X PUT "${ELASTICSEARCH_HOST}/_ilm/policy/trans_policy?pretty" \
-H 'Content-Type: application/json' \
-H "Authorization: Basic ${BASICAUTH_BASE64}" \
-d'
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_primary_shard_size": "100MB" 
          }
        }
      },
      "delete": {
        "min_age": "7d",
        "actions": {
          "delete": {} 
        }
      }
    }
  }
}
' -v

curl -s --cacert /usr/share/elasticsearch/config/certs/ca/ca.crt \
-X PUT "${ELASTICSEARCH_HOST}/_index_template/django_template?pretty" \
-H 'Content-Type: application/json' \
-H "Authorization: Basic ${BASICAUTH_BASE64}" \
-d'
{
  "index_patterns": ["django-*"], 
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 1,
      "index.lifecycle.name": "trans_policy", 
      "index.lifecycle.rollover_alias": "django-alias" 
    }
  }
}
' -v

curl -s --cacert /usr/share/elasticsearch/config/certs/ca/ca.crt \
-X PUT "${ELASTICSEARCH_HOST}/_index_template/nginx_template?pretty" \
-H 'Content-Type: application/json' \
-H "Authorization: Basic ${BASICAUTH_BASE64}" \
-d'
{
  "index_patterns": ["nginx-*"], 
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 1,
      "index.lifecycle.name": "trans_policy", 
      "index.lifecycle.rollover_alias": "nginx-alias" 
    }
  }
}
' -v
