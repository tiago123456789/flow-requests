FROM denoland/deno:2.6.3

ENV API_KEY=""
ENV MCP_TOKEN_SECRET=""
ENV DB_URL=""
ENV WEBHOOK_MODE="false"

EXPOSE 8000

WORKDIR /app

COPY . .

RUN deno install

CMD ["deno", "run", "--allow-all", "main.ts"]
