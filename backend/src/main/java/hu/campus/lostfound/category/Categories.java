package hu.campus.lostfound.category;

import java.util.List;

/** Must mirror frontend/src/domain/categories.ts exactly. */
public final class Categories {

    public static final List<String> VALUES = List.of(
            "Electronics",
            "Clothing",
            "Bag / backpack",
            "ID / document",
            "Keys",
            "Jewelry / watch",
            "Book / notes",
            "Other"
    );

    public static final String FALLBACK = "Other";

    private Categories() {
    }
}
