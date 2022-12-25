FROM node:16-slim

LABEL version="0.0.1"

LABEL com.github.actions.name="Fridgefm monologue"
LABEL com.github.actions.description="Release "
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="red"

ENTRYPOINT ["/entrypoint.sh"]
CMD ["help"]