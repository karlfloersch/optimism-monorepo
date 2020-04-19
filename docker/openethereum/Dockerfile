FROM openethereum/openethereum
USER root
COPY config.toml .
COPY instant_seal.json .
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 9545
ENTRYPOINT ["sh", "/home/parity/entrypoint.sh"]
