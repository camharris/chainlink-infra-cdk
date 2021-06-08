FROM smartcontract/chainlink:latest

ARG api_user
ARG api_pass
ARG password

RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  wget \
  vim \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*



RUN mkdir /chainlink

# Grab dockerize so chainlink can wait for pgsql
ENV DOCKERIZE_VERSION v0.6.1
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz

RUN echo "${api_user}" > /chainlink/.api && echo "${api_pass}" >> /chainlink/.api &&\
    echo "${password}" > /chainlink/.password
ENTRYPOINT []
CMD ["sh", "-c", "export DATABASE_URL=postgresql://$DB_USERNAME:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME && echo $DATABASE_URL && chainlink local node -p /chainlink/.password -a /chainlink/.api"]