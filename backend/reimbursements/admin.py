from django.contrib import admin
from .models import (
    FundingGroup,
    Application,
    ApplicationItem,
    BudgetEntry,
    IncomeEntry,
    CashExpenseEntry,
    CashIncomeEntry,
)

admin.site.register(FundingGroup)
admin.site.register(ApplicationItem)
admin.site.register(BudgetEntry)
admin.site.register(IncomeEntry)
admin.site.register(CashExpenseEntry)
admin.site.register(CashIncomeEntry)

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ('get_applicant_full_name', 'status', 'submitted_at')
    list_filter = ('status',)

    @admin.display(description='Antragsteller')
    def get_applicant_full_name(self, obj):
        return obj.applicant.get_full_name() or obj.applicant.username