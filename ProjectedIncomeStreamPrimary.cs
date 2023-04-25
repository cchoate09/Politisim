using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;

public class ProjectedIncomeStreamPrimary : MonoBehaviour
{
    public GeneralElectionStateVisitsPrimary gesv;
    public StateStaffChoicePrimary ssc;
    public Dictionary<string, float> delegateCount = new Dictionary<string, float>();
    public float amount;
    public float fundraisingVisit = 500000f;
    public TextAsset txt;
    public List<string> lines;
    public float staffMult = 15000f;
    public float fundMult = 0.5f;
    public float delegateTotal = 0f;

    // Start is called before the first frame update

    void Start()
    {
        fundMult += (float)Variables.Saved.Get("Fundraising");
        delegateTotal = 0;
        bool dem = (bool)Variables.Saved.Get("Democrats");
        if (dem)
        {
            TextAsset txt = (TextAsset)Resources.Load("PrimaryStateData_D", typeof(TextAsset));
        }
        else
        {
            TextAsset txt = (TextAsset)Resources.Load("PrimaryStateData_R", typeof(TextAsset));
        }
        lines = (txt.text.Split('\n').ToList());
        for(int i = 0; i < lines.Count; i++)
        {
            List<string> l = new List<string>(lines[i].Split('\t').ToList());
            float d = float.Parse(l[1]);
            delegateTotal += d;
            delegateCount[l[0]] = d;
        }
    }

    void OnEnable()
    {
        amount = 0;

        foreach(KeyValuePair<string,string> stateInfo in gesv.stateVisits)
        {
            var anArray = gesv.stateVisits[stateInfo.Key].Split('\n');
            int visitCount = int.Parse(anArray[1]);
            float n = lines.Count * 1.0f;
            for (int i = 1; i <= visitCount; i++)
            {
                float mod = 1;
                if (delegateCount.ContainsKey(stateInfo.Key))
                {
                    mod = delegateCount[stateInfo.Key] / (delegateTotal/n);
                }
                amount += (mod*fundraisingVisit*1/i)*fundMult;
            }
        }
        foreach(KeyValuePair<string,string> stateStaff in ssc.stateStaffData)
        {
            var anArray = ssc.stateStaffData[stateStaff.Key].Split('\n');
            float staffCount = float.Parse(anArray[2]);
            float n = lines.Count * 1.0f;
            float mod = 1;
            int diff = (int)Variables.Saved.Get("difficultyLevel");
            staffMult /= (diff + 1.0f);
            if (delegateCount.ContainsKey(anArray[0]))
            {
                mod = delegateCount[anArray[0]] / (delegateTotal/n);
            }
            amount += mod*staffMult*staffCount;
        }
        Variables.ActiveScene.Set("fundraising", amount);
        string formattedNumber = string.Format("{0:n0}", amount);
        gameObject.GetComponentInChildren<TextMeshProUGUI>().text = "$" + formattedNumber;
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}
