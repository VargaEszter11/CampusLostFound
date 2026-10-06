package hu.campus.lostfound.report;

import hu.campus.lostfound.shared.ForbiddenException;
import hu.campus.lostfound.user.User;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class ReportAccess {

    public boolean isReporter(Report report, UUID userId) {
        return report.getReporter().getId().equals(userId);
    }

    public void requireReporter(Report report, User user, String action) {
        if (!isReporter(report, user.getId())) {
            throw new ForbiddenException("Only the reporter can " + action);
        }
    }
}
