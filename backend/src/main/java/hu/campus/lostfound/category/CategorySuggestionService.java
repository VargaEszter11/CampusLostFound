package hu.campus.lostfound.category;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import hu.campus.lostfound.shared.BadRequestException;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class CategorySuggestionService {

    private final RestClient restClient;
    private final String apiKey;
    private final String model;
    private final ObjectMapper objectMapper;

    public CategorySuggestionService(
            @Value("${app.deepseek.api-key:}") String apiKey,
            @Value("${app.deepseek.base-url:https://api.deepseek.com}") String baseUrl,
            @Value("${app.deepseek.model:deepseek-chat}") String model,
            ObjectMapper objectMapper
    ) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
    }

    public boolean isConfigured() {
        return !apiKey.isEmpty();
    }

    public SuggestCategoryResponse suggest(SuggestCategoryRequest request) {
        if (!isConfigured()) {
            throw new BadRequestException("Category suggestion is not configured on the server");
        }

        String systemPrompt = "You categorize lost-and-found items for a university. Reply with strict JSON "
                + "{\"category\": \"<one value>\"} choosing exactly one value from this list, copied verbatim, "
                + "with no other text: " + String.join(", ", Categories.VALUES);
        String userPrompt = "Item name: " + request.itemName()
                + (request.itemDescription() == null || request.itemDescription().isBlank()
                        ? ""
                        : "\nDescription: " + request.itemDescription());

        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userPrompt)
                ),
                "temperature", 0.2,
                "max_tokens", 30,
                "response_format", Map.of("type", "json_object")
        );

        try {
            String raw = restClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(raw);
            String content = root.path("choices").path(0).path("message").path("content").asText("");
            JsonNode parsed = objectMapper.readTree(content);
            String category = parsed.path("category").asText("");

            return new SuggestCategoryResponse(Categories.VALUES.contains(category) ? category : Categories.FALLBACK);
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BadRequestException("Could not get a category suggestion");
        }
    }
}
